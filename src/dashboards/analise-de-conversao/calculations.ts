import { normalizeCodperlet } from '@/lib/supabasePaginate';
import { CALENDAR, fiscalLabel, fiscalSortKey } from './constants';
import { codperletToAno, dateInRange, parseDecimal, parseFlexibleDate, toISODate } from './dateUtils';
import type {
  ChartDatum,
  ConversaoFilters,
  DashboardDataset,
  EspecializacoesData,
  EspecializacoesMensalDatum,
  GeralKpis,
  GraduacaoData,
  LeadsData,
  LeadsMensalDatum,
  MestradoData,
  ModalidadePosData,
  RawMatriculaPosRow,
  RawRubeusRow,
  RematriculaData,
  CursosLivresData,
} from './types';

// Valores EXATOS do banco (acentuados) — sem acento a exclusão nunca casava.
const BOLSAS_INCENTIVO = new Set([
  'BOLSA INCENTIVO EDUCACIONAL',
  'BOLSA SOCIOECONÔMICA',
]);

// Strings literais herdadas do DAX do Power BI ('Pré Matricula' não existe no
// banco — filtro morto herdado, preservado de propósito para paridade).
const SITUACOES_EXCLUIR_BASE_POS = new Set([
  'Óbito',
  'Evadido Curso',
  'Formado',
  'Troca de Ciclo',
  'Transferência Interna',
  'Pré Matricula',
]);

/**
 * Conjuntos pesados calculados UMA vez por dataset (WeakMap): sem isso, cada
 * troca de filtro reconstruía Sets de dezenas de milhares de nomes e varria
 * a tabela de bolsas linha a linha (travava a interface).
 */
type SharedSets = {
  inscNames: Set<string>;
  matNames: Set<string>;
  rubeusNames: Set<string>;
  bolsistaRas: Set<string>;
};

const sharedSetsCache = new WeakMap<DashboardDataset, SharedSets>();

function getSharedSets(ds: DashboardDataset): SharedSets {
  const cached = sharedSetsCache.get(ds);
  if (cached) return cached;

  const inscNames = new Set<string>();
  for (const r of ds.inscricoesGrad) {
    if (r.nome) inscNames.add(r.nome.trim());
  }

  const matNames = new Set<string>();
  for (const r of ds.matriculasMestrado) {
    if (r.aluno) matNames.add(r.aluno.trim());
  }
  for (const r of ds.matriculasCursosLives) {
    if (r.aluno) matNames.add(r.aluno.trim());
  }
  for (const r of ds.matriculasPos) {
    if (r.aluno) matNames.add(r.aluno.trim());
  }
  for (const r of ds.matriculasGrad) {
    if (r.aluno) matNames.add(r.aluno.trim());
  }

  const rubeusNames = new Set<string>();
  for (const r of ds.rubeus) {
    if (r.pessoa_nome) rubeusNames.add(r.pessoa_nome.trim());
  }

  const bolsistaRas = new Set<string>();
  for (const r of ds.matriculasBolsas) {
    if (r.ra && BOLSAS_INCENTIVO.has((r.bolsa ?? '').trim())) {
      bolsistaRas.add(r.ra);
    }
  }

  const sets: SharedSets = { inscNames, matNames, rubeusNames, bolsistaRas };
  sharedSetsCache.set(ds, sets);
  return sets;
}

const PROCESSO_MAP: Record<string, string> = {
  'Graduacao': 'Graduação',
  'Pós Graduação': 'Pós Graduação',
  'Mestrado': 'Mestrado',
  'Cursos Livres': 'Cursos Livres',
};

export function buildFilterOptions(ds: DashboardDataset) {
  const codperletOptions = ds.pletivo
    .map((p) => p.periodo_letivo)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const anoOptions = Array.from(
    new Set(
      ds.rubeus
        .map((r) => {
          if (r.momento_ano !== null && r.momento_ano !== undefined) {
            const n = Number(r.momento_ano);
            return Number.isFinite(n) ? n : null;
          }
          return null;
        })
        .filter((n): n is number => n !== null),
    ),
  ).sort((a, b) => a - b);

  const mesOptions = CALENDAR.filter((c) => c.ano === 2025).map((c) => ({
    numero: c.mes,
    nome: c.mesNome,
  }));

  return { codperletOptions, anoOptions, mesOptions };
}

function filterRubeusByDate(
  rubeus: RawRubeusRow[],
  filters: ConversaoFilters,
): RawRubeusRow[] {
  if (!filters.dataInicio && !filters.dataFim) return rubeus;
  return rubeus.filter((r) => dateInRange(r.momento_date, filters.dataInicio, filters.dataFim));
}

function filterRubeusByAnoMes(
  rubeus: RawRubeusRow[],
  filters: ConversaoFilters,
): RawRubeusRow[] {
  let out = rubeus;
  if (filters.ano.length > 0) {
    const anoSet = new Set(filters.ano);
    out = out.filter((r) => {
      const a = r.momento_ano !== null && r.momento_ano !== undefined ? Number(r.momento_ano) : null;
      return a !== null && anoSet.has(a);
    });
  }
  if (filters.mes.length > 0) {
    const mesSet = new Set(filters.mes);
    out = out.filter((r) => {
      const d = parseFlexibleDate(r.momento_date);
      return d !== null && mesSet.has(d.getMonth() + 1);
    });
  }
  return out;
}

export function computeGeralKpis(
  ds: DashboardDataset,
  filters: ConversaoFilters,
): GeralKpis {
  const pletivoSorted = [...ds.pletivo].sort((a, b) => (a.indice ?? 0) - (b.indice ?? 0));

  const matEfetByPeriodo = new Map<string, number>();
  for (const r of ds.matriculasGrad) {
    if (r.situacao !== 'Matriculado') continue;
    if (r.tipomatricula !== 'Nova Matricula') continue;
    if (!r.ra) continue;
    const cp = normalizeCodperlet(r.codperlet);
    if (!cp) continue;
    matEfetByPeriodo.set(cp, (matEfetByPeriodo.get(cp) ?? 0) + 1);
  }

  const periodoAtual = pletivoSorted[pletivoSorted.length - 1]?.periodo_letivo ?? '';
  const periodoAnterior = pletivoSorted[pletivoSorted.length - 2]?.periodo_letivo ?? '';

  const vagasAtual = ds.pletivo.find((p) => p.periodo_letivo === periodoAtual)?.numero_vagas ?? 0;
  const vagasAnterior = ds.pletivo.find((p) => p.periodo_letivo === periodoAnterior)?.numero_vagas ?? 0;

  const matEfetAtual = matEfetByPeriodo.get(periodoAtual) ?? 0;
  const matEfetAnterior = matEfetByPeriodo.get(periodoAnterior) ?? 0;

  const gradPctMetaAtual = vagasAtual > 0 ? matEfetAtual / vagasAtual : 0;
  const gradPctMetaAnterior = vagasAnterior > 0 ? matEfetAnterior / vagasAnterior : 0;

  const anoCorrente = filters.ano.length > 0 ? filters.ano[0] : new Date().getFullYear();

  const basePos = computeBasePos(ds.matriculasPos, filters);
  const especFatEad = basePos
    .filter((r) => (r.distanciapresencial ?? '').trim().toUpperCase() === 'D')
    .reduce((s, r) => s + parseDecimal(r.faturadobruto), 0);
  const especFatPres = basePos
    .filter((r) => (r.distanciapresencial ?? '').trim().toUpperCase() === 'P')
    .reduce((s, r) => s + parseDecimal(r.faturadobruto), 0);
  const especFat = especFatEad + especFatPres;

  let especMetaFat = 0;
  if (filters.mes.length > 0) {
    for (const m of filters.mes) {
      for (const meta of ds.metaPos) {
        if (meta.ano === anoCorrente && meta.mes_numero === m) {
          especMetaFat += Number(meta.meta);
        }
      }
    }
  } else {
    for (const meta of ds.metaPos) {
      if (meta.ano === anoCorrente) especMetaFat += Number(meta.meta);
    }
  }
  const especPctMeta = especMetaFat > 0 ? especFat / especMetaFat : 0;

  const mestMat = ds.matriculasMestrado.filter(
    (r) => r.tipomatricula === 'Nova Matricula' && r.situacao === 'Matriculado',
  ).length;

  const mestMeta = 20;
  const mestPctMeta = mestMat / mestMeta;

  return {
    gradPctMetaAtual,
    gradPctMetaAnterior,
    gradPeriodoAtual: periodoAtual,
    gradPeriodoAnterior: periodoAnterior,
    gradMatEfetAtual: matEfetAtual,
    gradVagasAtual: vagasAtual,
    gradMatEfetAnterior: matEfetAnterior,
    gradVagasAnterior: vagasAnterior,
    especPctMeta,
    especFat,
    especFatEad,
    especFatPres,
    especMetaFat,
    mestPctMeta,
    mestMat,
    mestMeta,
    mestAno: anoCorrente,
  };
}

function computeBasePos(
  rows: RawMatriculaPosRow[],
  filters: ConversaoFilters,
): RawMatriculaPosRow[] {
  const inicio = filters.dataInicio;
  const fim = filters.dataFim;

  return rows.filter((r) => {
    const curso = (r.curso ?? '').trim();
    if (curso === 'Pós-graduação em Direito Público (ead)') return false;

    const desconto = (r.descontoaluno ?? '').trim();
    if (desconto !== 'Pagante') return false;

    const sit = (r.situacao ?? '').trim();
    if (SITUACOES_EXCLUIR_BASE_POS.has(sit)) return false;

    const aluno = (r.aluno ?? '').trim();
    if (aluno === 'Eric Maldaner Molter') return false;

    const bolsas = (r.bolsas ?? '').toUpperCase();
    const bolsa3 = (r.bolsa3 ?? '').toUpperCase();
    const temTrocaPL = bolsas.includes('TROCA DE PL') || bolsa3.includes('TROCA DE PL');
    if (temTrocaPL && aluno !== 'Bruno Barbosa da Silveira') return false;

    const baixaIso = toISODate(r.databaixa);
    if (!baixaIso) return false;
    if (inicio && baixaIso < inicio) return false;
    if (fim && baixaIso > fim) return false;

    const cancelIso = toISODate(r.datacancelamentomatricula);
    if (cancelIso) {
      if (!inicio && !fim) return false;
      if (inicio && cancelIso >= inicio && fim && cancelIso <= fim) return false;
      if (inicio && !fim && cancelIso >= inicio) return false;
      if (!inicio && fim && cancelIso <= fim) return false;
    }

    return true;
  });
}

function buildInscLeadSet(ds: DashboardDataset): Set<string> {
  return getSharedSets(ds).inscNames;
}

function buildMatLeadSet(ds: DashboardDataset): Set<string> {
  return getSharedSets(ds).matNames;
}

function countLeadsByProcesso(
  rubeus: RawRubeusRow[],
  processo: string,
): number {
  return rubeus.filter((r) => r.processo === processo).length;
}

function computeConvLeadsInsc(
  rubeus: RawRubeusRow[],
  processo: string,
  inscNames: Set<string>,
): number {
  return rubeus
    .filter((r) => r.processo === processo && r.pessoa_nome)
    .filter((r) => inscNames.has((r.pessoa_nome ?? '').trim())).length;
}

function computeConvLeadsMat(
  rubeus: RawRubeusRow[],
  processo: string,
  matNames: Set<string>,
): number {
  return rubeus
    .filter((r) => r.processo === processo && r.pessoa_nome)
    .filter((r) => matNames.has((r.pessoa_nome ?? '').trim())).length;
}

function buildMensalSeries(
  rubeus: RawRubeusRow[],
  processo: string,
  inscNames: Set<string>,
  matNames: Set<string>,
  filters: ConversaoFilters,
): LeadsMensalDatum[] {
  const byMesAno = new Map<string, { leads: number; convInsc: number; convMat: number; ano: number; mes: number }>();

  const filtered = filterRubeusByDate(rubeus, filters).filter((r) => r.processo === processo);

  for (const r of filtered) {
    const d = parseFlexibleDate(r.momento_date);
    if (!d) continue;
    const ano = d.getFullYear();
    const mes = d.getMonth() + 1;
    const key = `${ano}-${mes}`;
    const entry = byMesAno.get(key) ?? { leads: 0, convInsc: 0, convMat: 0, ano, mes };
    entry.leads++;
    if (r.pessoa_nome && inscNames.has((r.pessoa_nome ?? '').trim())) entry.convInsc++;
    if (r.pessoa_nome && matNames.has((r.pessoa_nome ?? '').trim())) entry.convMat++;
    byMesAno.set(key, entry);
  }

  const result: LeadsMensalDatum[] = [];
  for (const c of CALENDAR) {
    const key = `${c.ano}-${c.mes}`;
    const entry = byMesAno.get(key);
    result.push({
      mesAno: fiscalLabel(c.ano, c.mes),
      ordemFiscal: fiscalSortKey(c.ano, c.mes),
      leads: entry?.leads ?? 0,
      convLeadsInsc: entry?.convInsc ?? 0,
      convLeadsMat: entry?.convMat ?? 0,
    });
  }

  return result.sort((a, b) => a.ordemFiscal - b.ordemFiscal);
}

export function computeLeadsData(
  ds: DashboardDataset,
  filters: ConversaoFilters,
): LeadsData {
  const inscNames = buildInscLeadSet(ds);
  const matNames = buildMatLeadSet(ds);
  const rubeusFiltered = filterRubeusByDate(ds.rubeus, filters);

  const gradMensal = buildMensalSeries(rubeusFiltered, 'Graduação', inscNames, matNames, filters);
  const especMensal = buildMensalSeries(rubeusFiltered, 'Pós Graduação', inscNames, matNames, filters);
  const mestMensal = buildMensalSeries(rubeusFiltered, 'Mestrado', inscNames, matNames, filters);

  const canalMap = new Map<string, number>();
  for (const r of rubeusFiltered) {
    const canal = (r.canal_nome ?? 'Nao informado').trim();
    canalMap.set(canal, (canalMap.get(canal) ?? 0) + 1);
  }
  const leadsPorCanal: ChartDatum[] = Array.from(canalMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const entradaMap = new Map<string, { grad: number; espec: number; ano: number; mes: number }>();
  for (const r of rubeusFiltered) {
    const d = parseFlexibleDate(r.momento_date);
    if (!d) continue;
    const ano = d.getFullYear();
    const mes = d.getMonth() + 1;
    const key = `${ano}-${mes}`;
    const entry = entradaMap.get(key) ?? { grad: 0, espec: 0, ano, mes };
    if (r.processo === 'Graduação') entry.grad++;
    if (r.processo === 'Pós Graduação') entry.espec++;
    entradaMap.set(key, entry);
  }
  const entradaGradEspec: LeadsMensalDatum[] = [];
  for (const c of CALENDAR) {
    const key = `${c.ano}-${c.mes}`;
    const entry = entradaMap.get(key);
    entradaGradEspec.push({
      mesAno: fiscalLabel(c.ano, c.mes),
      ordemFiscal: fiscalSortKey(c.ano, c.mes),
      leads: entry?.grad ?? 0,
      convLeadsInsc: entry?.espec ?? 0,
      convLeadsMat: 0,
    });
  }
  entradaGradEspec.sort((a, b) => a.ordemFiscal - b.ordemFiscal);

  return {
    gradMensal,
    especMensal,
    mestMensal,
    leadsPorCanal,
    entradaGradEspec,
  };
}

export function countLeadsByProcessoPublic(
  ds: DashboardDataset,
  processo: string,
  filters: ConversaoFilters,
): number {
  const rubeusFiltered = filterRubeusByDate(ds.rubeus, filters);
  return countLeadsByProcesso(rubeusFiltered, processo);
}

export function isBolsista(ds: DashboardDataset, ra: string): boolean {
  return getSharedSets(ds).bolsistaRas.has(ra);
}

export function modalidadePos(processoseletivo: string | null): string {
  return processoseletivo === 'Inscrição Pós Graduação Presencial'
    ? 'Pós Presencial'
    : 'Pós EAD';
}

const SITUACAO_CANCELADO_CURSO = 'Cancelado \u2013 Curso';

const EV_TIPO_CANCELADO = new Set([
  'Reingresso',
  'Rematricula',
  'Rematr\u00edcula n\u00e3o realizada',
  'N\u00e3o desejou reingressar',
  'Limite de trancamento ultrapassado',
  'Nova Matricula',
]);

const EV_TIPO_EVADIDO = new Set([
  'Aguardando reingresso',
  'Limite de trancamento ultrapassado',
  'N\u00e3o desejou reingressar',
  'Reingresso',
  'Rematr\u00edcula n\u00e3o realizada',
]);

const EV_TIPO_JUBILADO = new Set([
  'Jubilamento',
  'Rematr\u00edcula n\u00e3o realizada',
]);

const EV_TIPO_TRANSFERIDO = new Set([
  'N\u00e3o desejou reingressar',
  'Nova Matricula',
  'Rematricula',
  'Rematr\u00edcula n\u00e3o realizada',
]);

const EV_TIPO_TRANCADO = new Set([
  'N\u00e3o desejou reingressar',
  'Nova Matricula',
  'Reingresso',
  'Rematricula',
  'Rematr\u00edcula n\u00e3o realizada',
  'Renova\u00e7\u00e3o Trancamento',
]);

function filterMatriculasGradByPeriodo(
  ds: DashboardDataset,
  filters: ConversaoFilters,
) {
  let rows = ds.matriculasGrad;
  if (filters.codperlet.length > 0) {
    const cpSet = new Set(filters.codperlet.map(normalizeCodperlet));
    rows = rows.filter((r) => cpSet.has(normalizeCodperlet(r.codperlet)));
  }
  return rows;
}

function filterInscricoesGradByPeriodo(
  ds: DashboardDataset,
  filters: ConversaoFilters,
) {
  let rows = ds.inscricoesGrad;
  if (filters.codperlet.length > 0) {
    const cpSet = new Set(filters.codperlet.map(normalizeCodperlet));
    rows = rows.filter((r) => cpSet.has(normalizeCodperlet(r.processoseletivo)));
  }
  return rows;
}

export function computeGraduacaoData(
  ds: DashboardDataset,
  filters: ConversaoFilters,
): GraduacaoData {
  const matRows = filterMatriculasGradByPeriodo(ds, filters);
  const inscRows = filterInscricoesGradByPeriodo(ds, filters);
  const rubeusFiltered = filterRubeusByDate(ds.rubeus, filters);

  const leads = countLeadsByProcesso(rubeusFiltered, 'Graduação');
  // Fiel ao Power BI: Grad_Insc = DISTINCTCOUNT(cpf)
  const insc = new Set(
    inscRows.map((r) => (r.cpf ?? '').trim()).filter(Boolean),
  ).size;
  const inscxLeads = computeConvLeadsInsc(rubeusFiltered, 'Graduação', buildInscLeadSet(ds));

  const matEfetRas = new Set<string>();
  for (const r of matRows) {
    if (r.situacao === 'Matriculado' && r.tipomatricula === 'Nova Matricula' && r.ra) {
      matEfetRas.add(r.ra);
    }
  }
  const matEfet = matEfetRas.size;

  const matPreRas = new Set<string>();
  for (const r of matRows) {
    if (r.situacao === 'Pré-Matrícula' && r.tipomatricula === 'Nova Matricula' && r.ra) {
      matPreRas.add(r.ra);
    }
  }
  const matPre = matPreRas.size;

  const matCancRas = new Set<string>();
  for (const r of matRows) {
    if (r.situacao === SITUACAO_CANCELADO_CURSO && r.tipomatricula === 'Nova Matricula' && r.ra) {
      matCancRas.add(r.ra);
    }
  }
  const matCanc = matCancRas.size;

  const bolsistaRas = getSharedSets(ds).bolsistaRas;
  const matBolsas = matRows.filter(
    (r) =>
      r.tipomatricula === 'Nova Matricula' &&
      r.situacao === 'Matriculado' &&
      r.aluno &&
      r.ra &&
      bolsistaRas.has(r.ra),
  ).length;

  const matPgt = matEfet - matBolsas;

  const periodoAtual = [...ds.pletivo].sort((a, b) => (a.indice ?? 0) - (b.indice ?? 0)).slice(-1)[0]?.periodo_letivo ?? '';
  const vagas = ds.pletivo.find((p) => p.periodo_letivo === periodoAtual)?.numero_vagas ?? 0;
  const pctMeta = vagas > 0 ? matEfet / vagas : 0;

  const pctConvIxL = leads > 0 ? inscxLeads / leads : 0;
  const pctConvMxI = inscxLeads > 0 ? matEfet / inscxLeads : 0;
  const pctConvMxL = leads > 0 ? matEfet / leads : 0;

  const pgtVsBolsas: ChartDatum[] = [
    { categoria: 'Pagantes', valor: matPgt },
    { categoria: 'Bolsistas', valor: matBolsas },
  ];

  const turnoMap = new Map<string, number>();
  for (const r of inscRows) {
    const turno = (r.areainteresse ?? 'Nao informado').trim();
    turnoMap.set(turno, (turnoMap.get(turno) ?? 0) + 1);
  }
  const inscPorTurno = Array.from(turnoMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const procMap = new Map<string, number>();
  for (const r of inscRows) {
    const proc = (r.processoseletivo ?? 'Nao informado').trim();
    procMap.set(proc, (procMap.get(proc) ?? 0) + 1);
  }
  const inscPorProcesso = Array.from(procMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const ingressoMap = new Map<string, number>();
  for (const r of matRows) {
    if (r.situacao !== 'Matriculado' || r.tipomatricula !== 'Nova Matricula') continue;
    const ing = (r.tipoingresso ?? 'Nao informado').trim();
    ingressoMap.set(ing, (ingressoMap.get(ing) ?? 0) + 1);
  }
  const matPorTipoIngresso = Array.from(ingressoMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const diaMap = new Map<string, number>();
  for (const r of matRows) {
    if (r.situacao !== 'Matriculado' || r.tipomatricula !== 'Nova Matricula') continue;
    const iso = toISODate(r.datamatricula);
    if (!iso) continue;
    diaMap.set(iso, (diaMap.get(iso) ?? 0) + 1);
  }
  const matPorDia = Array.from(diaMap.entries())
    .map(([data, valor]) => ({ data, valor }))
    .sort((a, b) => a.data.localeCompare(b.data));

  return {
    leads,
    insc,
    matEfet,
    vagas,
    matCanc,
    matPre,
    matBolsas,
    matPgt,
    pctMeta,
    pctConvIxL,
    pctConvMxI,
    pctConvMxL,
    pgtVsBolsas,
    inscPorTurno,
    inscPorProcesso,
    matPorTipoIngresso,
    matPorDia,
  };
}

export function computeRematriculaData(
  ds: DashboardDataset,
  filters: ConversaoFilters,
): RematriculaData {
  const matRows = filterMatriculasGradByPeriodo(ds, filters);

  const periodos = [...ds.pletivo].sort((a, b) => (a.indice ?? 0) - (b.indice ?? 0)).map((p) => p.periodo_letivo);

  const evasaoPorPeriodo = periodos.map((periodo) => {
    const rows = matRows.filter((r) => normalizeCodperlet(r.codperlet) === periodo);

    const evJubilado = rows.filter(
      (r) => r.situacao === 'Jubilado' && EV_TIPO_JUBILADO.has((r.tipomatricula ?? '').trim()),
    ).length;

    const evEvadido = rows.filter(
      (r) => r.situacao === 'Evadido Curso' && EV_TIPO_EVADIDO.has((r.tipomatricula ?? '').trim()),
    ).length;

    const evCancelado = rows.filter(
      (r) => r.situacao === SITUACAO_CANCELADO_CURSO && EV_TIPO_CANCELADO.has((r.tipomatricula ?? '').trim()),
    ).length;

    const evTransferido = rows.filter(
      (r) => r.situacao === 'Transferido de Instituição' && EV_TIPO_TRANSFERIDO.has((r.tipomatricula ?? '').trim()),
    ).length;

    return { periodo, evJubilado, evEvadido, evCancelado, evTransferido };
  });

  const reingressoPorPeriodo = periodos.map((periodo) => {
    const rows = matRows.filter((r) => normalizeCodperlet(r.codperlet) === periodo);

    const reingressoConf = rows.filter(
      (r) => r.tipomatricula === 'Reingresso' && r.situacao === 'Matriculado',
    ).length;

    const reingressoAguard = rows.filter(
      (r) => r.situacao === 'Aguardando pedido de reingress',
    ).length;

    return { periodo, reingressoConf, reingressoAguard };
  });

  const rematriculaPorPeriodo = periodos.map((periodo) => {
    const rows = matRows.filter((r) => normalizeCodperlet(r.codperlet) === periodo);

    const rematConf = rows.filter(
      (r) => r.tipomatricula === 'Rematricula' && r.situacao === 'Matriculado',
    ).length;

    const rematNaoRealiz = rows.filter(
      (r) => r.tipomatricula === 'Rematr\u00edcula n\u00e3o realizada',
    ).length;

    // BUG HERDADO do Power BI: compara o campo ra com o texto 'Pré-Matrícula'.
    // Resultado é sempre 0 pois ra nunca contém esse texto. Preservado intencionalmente.
    const _rematPend = rows.filter(
      (r) => r.tipomatricula === 'Rematricula' && r.ra === 'Pré-Matrícula',
    ).length;

    return { periodo, rematConf, rematNaoRealiz };
  });

  return { evasaoPorPeriodo, reingressoPorPeriodo, rematriculaPorPeriodo };
}

export function computeMestradoData(
  ds: DashboardDataset,
  filters: ConversaoFilters,
): MestradoData {
  let inscRows = ds.inscricoesMestrado;
  if (filters.codperlet.length > 0) {
    const cpSet = new Set(filters.codperlet.map(normalizeCodperlet));
    inscRows = inscRows.filter((r) => cpSet.has(normalizeCodperlet(r.periodo_letivo)));
  }

  let rubeusMest = ds.rubeus.filter((r) => r.processo === 'Mestrado');
  rubeusMest = filterRubeusByDate(rubeusMest, filters);
  if (filters.codperlet.length > 0) {
    // Rubeus não tem codperlet direto; respeita apenas filtro de data
  }

  const leads = rubeusMest.length;
  const insc = inscRows.length;

  const matRows = ds.matriculasMestrado.filter(
    (r) => r.tipomatricula === 'Nova Matricula' && r.situacao === 'Matriculado',
  );
  const mat = new Set(matRows.map((r) => r.ra).filter(Boolean)).size;

  const taxaPaga = ds.rubeus.filter((r) => r.etapa_nome === 'Taxa de Inscrição (Paga)').length;
  const taxaAPagar = ds.rubeus.filter((r) => r.etapa_nome === 'Taxa de inscrição (a pagar)').length;

  // quali_lead reproduzido do Power BI: aluno da matrícula existe em
  // rubeus.pessoa_nome (cruzamento por nome, feito só em memória).
  const rubeusNames = getSharedSets(ds).rubeusNames;
  const matQualificadasRas = new Set<string>();
  for (const r of ds.matriculasMestrado) {
    if (!r.ra || !r.aluno) continue;
    const sit = (r.situacao ?? '').trim();
    if (sit !== 'Matriculado' && sit !== 'Matriculado- Pendente Contrato') continue;
    if (rubeusNames.has(r.aluno.trim())) matQualificadasRas.add(r.ra);
  }
  const pctConversao = mat > 0 ? matQualificadasRas.size / mat : 0;

  const meta = 20;
  const pctMeta = mat / meta;

  const procMap = new Map<string, number>();
  for (const r of inscRows) {
    const proc = (r.processoseletivo ?? 'Nao informado').trim();
    procMap.set(proc, (procMap.get(proc) ?? 0) + 1);
  }
  const inscPorProcesso = Array.from(procMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const statusMap = new Map<string, number>();
  for (const r of inscRows) {
    const status = (r.statusps ?? 'Nao informado').trim();
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
  }
  const statusInscricoes = Array.from(statusMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const canalMap = new Map<string, number>();
  for (const r of rubeusMest) {
    const canal = (r.canal_nome ?? 'Nao informado').trim();
    canalMap.set(canal, (canalMap.get(canal) ?? 0) + 1);
  }
  const leadsPorCanal = Array.from(canalMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  return {
    leads,
    insc,
    mat,
    taxaPaga,
    taxaAPagar,
    pctConversao,
    pctMeta,
    inscPorProcesso,
    statusInscricoes,
    leadsPorCanal,
  };
}

const STATUS_INSCRICAO_POS = new Set([
  'Inscrito para seleção',
  'Aprovado',
  'Compareceu à chamada',
]);

function filterBasePosByAnoMes(
  basePos: RawMatriculaPosRow[],
  filters: ConversaoFilters,
): RawMatriculaPosRow[] {
  let out = basePos;
  if (filters.ano.length > 0) {
    const anoSet = new Set(filters.ano);
    out = out.filter((r) => {
      const baixaIso = toISODate(r.databaixa);
      if (!baixaIso) return false;
      const a = Number(baixaIso.slice(0, 4));
      return anoSet.has(a);
    });
  }
  if (filters.mes.length > 0) {
    const mesSet = new Set(filters.mes);
    out = out.filter((r) => {
      const baixaIso = toISODate(r.databaixa);
      if (!baixaIso) return false;
      const m = Number(baixaIso.slice(5, 7));
      return mesSet.has(m);
    });
  }
  return out;
}

function filterBasePosByCodperlet(
  basePos: RawMatriculaPosRow[],
  filters: ConversaoFilters,
): RawMatriculaPosRow[] {
  if (filters.codperlet.length === 0) return basePos;
  const cpSet = new Set(filters.codperlet.map(normalizeCodperlet));
  return basePos.filter((r) => cpSet.has(normalizeCodperlet(r.codperlet)));
}

function isEad(r: RawMatriculaPosRow): boolean {
  return (r.distanciapresencial ?? '').trim().toUpperCase() === 'D';
}

function isPresencial(r: RawMatriculaPosRow): boolean {
  return (r.distanciapresencial ?? '').trim().toUpperCase() === 'P';
}

export function computeEspecializacoesData(
  ds: DashboardDataset,
  filters: ConversaoFilters,
): EspecializacoesData {
  const rubeusFiltered = filterRubeusByAnoMes(
    filterRubeusByDate(ds.rubeus, filters),
    filters,
  );
  const leads = countLeadsByProcesso(rubeusFiltered, 'Pós Graduação');

  const basePos = filterBasePosByAnoMes(
    computeBasePos(ds.matriculasPos, filters),
    filters,
  );

  const fat = basePos.reduce((s, r) => s + parseDecimal(r.faturadobruto), 0);
  const fatEad = basePos.filter(isEad).reduce((s, r) => s + parseDecimal(r.faturadobruto), 0);
  const fatPres = basePos.filter(isPresencial).reduce((s, r) => s + parseDecimal(r.faturadobruto), 0);

  const mat = basePos.length;
  const matEad = basePos.filter(isEad).length;
  const matPres = basePos.filter(isPresencial).length;

  const tktMedio = mat > 0 ? fat / mat : 0;
  const tktMedioEad = matEad > 0 ? fatEad / matEad : 0;
  const tktMedioPres = matPres > 0 ? fatPres / matPres : 0;

  // Desconto_Médio: o Power BI atual exibe 0,00% porque a fonte do percentual de desconto
  // (valor original das bolsas vs faturado) não está disponível nos dados carregados.
  const descontoMedio = 0;

  const anoCorrente = filters.ano.length > 0 ? filters.ano[0] : new Date().getFullYear();
  let metaFat = 0;
  if (filters.mes.length > 0) {
    for (const m of filters.mes) {
      for (const meta of ds.metaPos) {
        if (meta.ano === anoCorrente && meta.mes_numero === m) {
          metaFat += Number(meta.meta);
        }
      }
    }
  } else {
    for (const meta of ds.metaPos) {
      if (meta.ano === anoCorrente) metaFat += Number(meta.meta);
    }
  }
  const pctMeta = metaFat > 0 ? fat / metaFat : 0;

  const fatMensalMap = new Map<string, { fat: number; mat: number; fatEad: number; fatPres: number; ano: number; mes: number }>();
  for (const r of basePos) {
    const baixaIso = toISODate(r.databaixa);
    if (!baixaIso) continue;
    const ano = Number(baixaIso.slice(0, 4));
    const mes = Number(baixaIso.slice(5, 7));
    const key = `${ano}-${mes}`;
    const entry = fatMensalMap.get(key) ?? { fat: 0, mat: 0, fatEad: 0, fatPres: 0, ano, mes };
    entry.mat++;
    const v = parseDecimal(r.faturadobruto);
    entry.fat += v;
    if (isEad(r)) entry.fatEad += v;
    if (isPresencial(r)) entry.fatPres += v;
    fatMensalMap.set(key, entry);
  }
  const fatMensal: EspecializacoesMensalDatum[] = [];
  for (const c of CALENDAR) {
    const key = `${c.ano}-${c.mes}`;
    const entry = fatMensalMap.get(key);
    if (entry) {
      fatMensal.push({
        mesAno: fiscalLabel(c.ano, c.mes),
        ordemFiscal: fiscalSortKey(c.ano, c.mes),
        fat: entry.fat,
        mat: entry.mat,
        fatEad: entry.fatEad,
        fatPres: entry.fatPres,
      });
    }
  }
  fatMensal.sort((a, b) => a.ordemFiscal - b.ordemFiscal);

  const cursoFatMap = new Map<string, number>();
  for (const r of basePos) {
    const curso = (r.cursoreduzido ?? 'Nao informado').trim();
    cursoFatMap.set(curso, (cursoFatMap.get(curso) ?? 0) + parseDecimal(r.faturadobruto));
  }
  const top5CursosFat: ChartDatum[] = Array.from(cursoFatMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const fatPorModalidade: ChartDatum[] = [
    { categoria: 'EAD', valor: fatEad },
    { categoria: 'Presencial', valor: fatPres },
  ];

  const comTcc = basePos.filter((r) => (r.tcc ?? '').trim().toUpperCase() === 'TCC').length;
  const semTcc = basePos.filter((r) => {
    const tcc = (r.tcc ?? '').trim();
    return tcc === '' || tcc.toUpperCase() === 'SEM TCC';
  }).length;
  const fatPorTcc: ChartDatum[] = [
    { categoria: 'TCC', valor: comTcc },
    { categoria: 'Sem TCC', valor: semTcc },
  ];

  return {
    leads,
    fat,
    fatEad,
    fatPres,
    metaFat,
    pctMeta,
    mat,
    tktMedio,
    tktMedioEad,
    tktMedioPres,
    descontoMedio,
    fatMensal,
    top5CursosFat,
    fatPorModalidade,
    fatPorTcc,
  };
}

export function computeModalidadePosData(
  ds: DashboardDataset,
  filters: ConversaoFilters,
  modalidade: 'Pós Presencial' | 'Pós EAD',
): ModalidadePosData {
  const rubeusFiltered = filterRubeusByAnoMes(
    filterRubeusByDate(ds.rubeus, filters),
    filters,
  );
  const leads = countLeadsByProcesso(rubeusFiltered, 'Pós Graduação');

  let basePos = filterBasePosByAnoMes(
    computeBasePos(ds.matriculasPos, filters),
    filters,
  );
  basePos = filterBasePosByCodperlet(basePos, filters);

  const modalidadeFilter = modalidade === 'Pós EAD' ? isEad : isPresencial;
  const rows = basePos.filter(modalidadeFilter);

  const mat = rows.length;
  const fat = rows.reduce((s, r) => s + parseDecimal(r.faturadobruto), 0);
  const tktMedio = mat > 0 ? fat / mat : 0;

  // Desconto_Médio: 0,00% — fonte do percentual indisponível nos dados carregados.
  const descontoMedio = 0;

  const comTcc = rows.filter((r) => (r.tcc ?? '').trim().toUpperCase() === 'TCC').length;
  const semTcc = rows.filter((r) => {
    const tcc = (r.tcc ?? '').trim();
    return tcc === '' || tcc.toUpperCase() === 'SEM TCC';
  }).length;

  let inscRows = ds.inscricoesPos.filter((r) => STATUS_INSCRICAO_POS.has((r.statusps ?? '').trim()));
  if (filters.ano.length > 0) {
    const anoSet = new Set(filters.ano);
    inscRows = inscRows.filter((r) => {
      const d = parseFlexibleDate(r.datainscricao);
      return d !== null && anoSet.has(d.getFullYear());
    });
  }
  if (filters.mes.length > 0) {
    const mesSet = new Set(filters.mes);
    inscRows = inscRows.filter((r) => {
      const d = parseFlexibleDate(r.datainscricao);
      return d !== null && mesSet.has(d.getMonth() + 1);
    });
  }

  const inscModalidadeFilter = modalidade === 'Pós EAD'
    ? (ps: string | null) => (ps ?? '').includes('EAD')
    : (ps: string | null) => (ps ?? '').includes('Presencial');
  const insc = inscRows.filter((r) => inscModalidadeFilter(r.processoseletivo)).length;

  const cursoFatMap = new Map<string, number>();
  for (const r of rows) {
    const curso = (r.cursoreduzido ?? 'Nao informado').trim();
    cursoFatMap.set(curso, (cursoFatMap.get(curso) ?? 0) + parseDecimal(r.faturadobruto));
  }
  const fatPorCurso: ChartDatum[] = Array.from(cursoFatMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const descontoFatMap = new Map<string, number>();
  for (const r of rows) {
    const bolsa = (r.bolsas ?? 'Nao informado').trim();
    descontoFatMap.set(bolsa, (descontoFatMap.get(bolsa) ?? 0) + parseDecimal(r.faturadobruto));
  }
  const topDescontosFat: ChartDatum[] = Array.from(descontoFatMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  const planoFatMap = new Map<string, number>();
  for (const r of rows) {
    const plano = String(r.codplanopgto ?? 'Nao informado').trim();
    planoFatMap.set(plano, (planoFatMap.get(plano) ?? 0) + parseDecimal(r.faturadobruto));
  }
  const top5PlanosPgto: ChartDatum[] = Array.from(planoFatMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const estadoFatMap = new Map<string, number>();
  for (const r of rows) {
    const uf = (r.estado ?? '').trim().toUpperCase();
    if (!uf || uf === '--' || uf.length !== 2) continue;
    estadoFatMap.set(uf, (estadoFatMap.get(uf) ?? 0) + parseDecimal(r.faturadobruto));
  }
  const fatPorEstado = Array.from(estadoFatMap.entries())
    .map(([uf, total]) => ({ uf, total }))
    .sort((a, b) => b.total - a.total);

  return {
    modalidade,
    leads,
    insc,
    mat,
    comTcc,
    semTcc,
    fat,
    tktMedio,
    descontoMedio,
    fatPorCurso,
    topDescontosFat,
    top5PlanosPgto,
    fatPorEstado,
  };
}

const SITUACAO_CL_MATRICULADO = new Set(['Matricula', 'Matriculado']);

export function computeCursosLivresData(
  ds: DashboardDataset,
  filters: ConversaoFilters,
): CursosLivresData {
  const rubeusFiltered = filterRubeusByDate(ds.rubeus, filters);
  const leads = countLeadsByProcesso(rubeusFiltered, 'Cursos Livres');

  // Inscrições de Cursos Livres já vêm agregadas por dia (ver queries.ts).
  let clDias = ds.clInscPorDia;
  if (filters.dataInicio || filters.dataFim) {
    clDias = clDias.filter((d) => d.data && dateInRange(d.data, filters.dataInicio, filters.dataFim));
  }
  const insc = clDias.reduce((s, d) => s + d.total, 0);
  const mat = clDias.reduce((s, d) => s + d.mat, 0);

  let matRows = ds.matriculasCursosLives.filter((r) =>
    SITUACAO_CL_MATRICULADO.has((r.situacao_matricula ?? '').trim()),
  );
  if (filters.dataInicio || filters.dataFim) {
    matRows = matRows.filter((r) => dateInRange(r.data_contrato, filters.dataInicio, filters.dataFim));
  }
  const fat = matRows.reduce((s, r) => s + parseDecimal(r.valor_curso_com_desconto), 0);

  const convLeadsMat = computeConvLeadsMat(rubeusFiltered, 'Cursos Livres', buildMatLeadSet(ds));

  // CL_%Conversão = CL_Conv_Leads_Mat / CL_Mat — herdado do Power BI, preservado mesmo parecendo invertido.
  const pctConversao = mat > 0 ? convLeadsMat / mat : 0;

  const canalMap = new Map<string, number>();
  for (const r of rubeusFiltered.filter((r) => r.processo === 'Cursos Livres')) {
    const canal = (r.canal_nome ?? 'Nao informado').trim();
    canalMap.set(canal, (canalMap.get(canal) ?? 0) + 1);
  }
  const leadsPorCanal: ChartDatum[] = Array.from(canalMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const mensalMap = new Map<string, { leads: number; mat: number; ano: number; mes: number }>();
  const clRubeus = rubeusFiltered.filter((r) => r.processo === 'Cursos Livres');
  for (const r of clRubeus) {
    const d = parseFlexibleDate(r.momento_date);
    if (!d) continue;
    const ano = d.getFullYear();
    const mes = d.getMonth() + 1;
    const key = `${ano}-${mes}`;
    const entry = mensalMap.get(key) ?? { leads: 0, mat: 0, ano, mes };
    entry.leads++;
    mensalMap.set(key, entry);
  }
  for (const dia of clDias) {
    if (!dia.data || dia.mat === 0) continue;
    const ano = Number(dia.data.slice(0, 4));
    const mes = Number(dia.data.slice(5, 7));
    if (!Number.isFinite(ano) || !Number.isFinite(mes)) continue;
    const key = `${ano}-${mes}`;
    const entry = mensalMap.get(key) ?? { leads: 0, mat: 0, ano, mes };
    entry.mat += dia.mat;
    mensalMap.set(key, entry);
  }
  const inscVsMatMensal: { mesAno: string; ordemFiscal: number; leads: number; mat: number }[] = [];
  for (const c of CALENDAR) {
    const key = `${c.ano}-${c.mes}`;
    const entry = mensalMap.get(key);
    if (entry) {
      inscVsMatMensal.push({
        mesAno: fiscalLabel(c.ano, c.mes),
        ordemFiscal: fiscalSortKey(c.ano, c.mes),
        leads: entry.leads,
        mat: entry.mat,
      });
    }
  }
  inscVsMatMensal.sort((a, b) => a.ordemFiscal - b.ordemFiscal);

  const cursoFatMap = new Map<string, number>();
  for (const r of matRows) {
    const curso = (r.curso ?? 'Nao informado').trim();
    cursoFatMap.set(curso, (cursoFatMap.get(curso) ?? 0) + parseDecimal(r.valor_curso_com_desconto));
  }
  const fatPorCurso: ChartDatum[] = Array.from(cursoFatMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  return {
    leads,
    insc,
    mat,
    pctConversao,
    fat,
    leadsPorCanal,
    inscVsMatMensal,
    fatPorCurso,
  };
}
