import { normalizeCodperlet } from '@/lib/supabasePaginate';
import { CALENDAR, fiscalLabel, fiscalSortKey } from './constants';
import { codperletToAno, dateInRange, parseDecimal, parseFlexibleDate, toISODate } from './dateUtils';
import type {
  ChartDatum,
  ConversaoFilters,
  DashboardDataset,
  GeralKpis,
  LeadsData,
  LeadsMensalDatum,
  RawMatriculaPosRow,
  RawRubeusRow,
} from './types';

const BOLSAS_INCENTIVO = new Set([
  'BOLSA INCENTIVO EDUCACIONAL',
  'BOLSA SOCIOECONOMICA',
]);

const SITUACOES_EXCLUIR_BASE_POS = new Set([
  'Obito',
  'Evadido Curso',
  'Formado',
  'Troca de Ciclo',
  'Transferencia Interna',
  'Pre Matricula',
]);

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
    .filter((r) => r.modalidadepos === 'Pós EAD')
    .reduce((s, r) => s + parseDecimal(r.faturadobruto), 0);
  const especFatPres = basePos
    .filter((r) => r.modalidadepos === 'Pós Presencial')
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

function buildNameSet(ds: DashboardDataset): Set<string> {
  const names = new Set<string>();
  for (const r of ds.matriculasMestrado) {
    if (r.aluno) names.add(r.aluno.trim());
  }
  for (const r of ds.matriculasCursosLives) {
    if (r.aluno) names.add(r.aluno.trim());
  }
  for (const r of ds.inscricoesGrad) {
    if (r.nome) names.add(r.nome.trim());
  }
  for (const r of ds.inscricoesMestrado) {
    if (r.nome) names.add(r.nome.trim());
  }
  return names;
}

function buildInscLeadSet(ds: DashboardDataset): Set<string> {
  const inscNames = new Set<string>();
  for (const r of ds.inscricoesGrad) {
    if (r.nome) inscNames.add(r.nome.trim());
  }
  return inscNames;
}

function buildMatLeadSet(ds: DashboardDataset): Set<string> {
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
  return matNames;
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
  return ds.matriculasBolsas.some(
    (r) => r.ra === ra && BOLSAS_INCENTIVO.has((r.bolsa ?? '').trim()),
  );
}

export function modalidadePos(processoseletivo: string | null): string {
  return processoseletivo === 'Inscrição Pós Graduação Presencial'
    ? 'Pós Presencial'
    : 'Pós EAD';
}
