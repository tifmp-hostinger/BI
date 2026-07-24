import type {
  BolsasFilters,
  ChartDatum,
  DimBeneficioMap,
  EnrichedBolsaRow,
  EvasaoPorAnoDatum,
  FilterOptions,
  MatriculadosData,
  PanoramaKpis,
  RawBolsaRow,
  RawDimBeneficio,
  TipoCurso,
} from './types';

const EVASAO_STATUSES = new Set<string>([
  'Cancelado – Curso',
  'Cancelado - Curso (Assin_Cont)',
  'Evadido Curso',
  'Transferido de Instituição',
]);

export function normalize(s: string | null | undefined): string {
  if (!s) return '';
  return s.trim().replace(/\s+/g, ' ').toUpperCase();
}

function parseValor(v: string | number | null | undefined): number {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normCodperlet(cp: string | null | undefined): string {
  if (!cp) return '';
  return cp.replace(/^_/, '').trim();
}

function anoFromCodperlet(cpNorm: string): number | null {
  const m = cpNorm.match(/^(\d{2})/);
  if (!m) return null;
  return 2000 + parseInt(m[1], 10);
}

function tipoCursoFromCurso(curso: string | null | undefined): TipoCurso {
  const c = curso ?? '';
  if (c === 'Direito') return 'Graduação';
  if (c === 'Mestrado Academico T.E.D.I') return 'Mestrado';
  if (c === 'Curso Preparação Concurso MP') return 'Curso Preparatório';
  return 'Pós Graduação';
}

export function buildDimMap(dim: RawDimBeneficio[]): DimBeneficioMap {
  const m: DimBeneficioMap = new Map();
  for (const r of dim) {
    const key = normalize(r.valor_original_rm ?? '');
    if (!key) continue;
    m.set(key, r.tipo_beneficio_padronizado ?? '');
  }
  return m;
}

function classifyTipoBeneficio(
  bolsaNorm: string,
  dimMap: DimBeneficioMap,
): string {
  const mapped = dimMap.get(bolsaNorm);
  if (mapped) return mapped;
  if (bolsaNorm.includes('DESCONTO')) return 'Desconto';
  if (bolsaNorm.includes('BOLSA')) return 'Bolsa';
  if (bolsaNorm.includes('SEM BOLSA')) return 'Sem Bolsa';
  return 'Pagamento Integral';
}

export function enrichBolsaRows(
  raw: RawBolsaRow[],
  dimMap: DimBeneficioMap,
): EnrichedBolsaRow[] {
  const out: EnrichedBolsaRow[] = new Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    const bolsaNorm = normalize(r.bolsa ?? '');
    const cpNorm = normCodperlet(r.codperlet);
    out[i] = {
      ra: r.ra,
      curso: r.curso,
      codperlet: r.codperlet,
      codperletNorm: cpNorm,
      ano: anoFromCodperlet(cpNorm),
      situacaoCurso: r.situacao_curso,
      situacaoMatriculaPl: r.situacao_matriculapl,
      bolsa: r.bolsa,
      bolsaPadronizada: bolsaNorm,
      tipoBeneficio: classifyTipoBeneficio(bolsaNorm, dimMap),
      tipoCurso: tipoCursoFromCurso(r.curso),
      codplanopgto: r.codplanopgto,
      valorOriginal: parseValor(r.valororiginal),
      valorDoLiq: parseValor(r.valordoliq),
    };
  }
  return out;
}

export function applyFilters(
  rows: EnrichedBolsaRow[],
  filters: BolsasFilters,
): EnrichedBolsaRow[] {
  return rows.filter((r) => {
    if (filters.codperlet && r.codperletNorm !== filters.codperlet) return false;
    if (filters.ano !== null && r.ano !== filters.ano) return false;
    if (filters.tipocurso && r.tipoCurso !== filters.tipocurso) return false;
    if (
      filters.bolsaPadronizada &&
      r.bolsaPadronizada !== filters.bolsaPadronizada
    ) {
      return false;
    }
    return true;
  });
}

export function computeMatriculasCount(
  m: MatriculadosData,
  codperletFilter: string | null,
): number {
  const set = new Set<string>();
  const add = (list: MatriculadosData[keyof MatriculadosData]) => {
    for (const r of list) {
      if (!r.ra) continue;
      if (codperletFilter && r.codperletNorm !== codperletFilter) continue;
      set.add(r.ra);
    }
  };
  add(m.grad);
  add(m.pos);
  add(m.mestrado);
  return set.size;
}

export function computePanoramaKpis(
  filtered: EnrichedBolsaRow[],
  matriculados: MatriculadosData,
  filters: BolsasFilters,
): PanoramaKpis {
  let bolsas = 0;
  let descontos = 0;
  let formados = 0;
  let fatOriginal = 0;
  let fatDesconto = 0;
  let evadido = 0;
  let transf = 0;
  let fatDescontoMat = 0;
  let renuncia = 0;

  const raCancelado = new Set<string>();
  const planoCancelado = new Set<string>();

  for (const r of filtered) {
    const isMat = r.situacaoMatriculaPl === 'Matriculado';
    const isForm = r.situacaoMatriculaPl === 'Formado';
    const isBolsa = r.tipoBeneficio === 'Bolsa';
    const isDesc = r.tipoBeneficio === 'Desconto';

    if (isMat && isBolsa) bolsas += 1;
    if (isMat && isDesc) descontos += 1;
    if (isForm) formados += 1;

    fatOriginal += r.valorOriginal;
    fatDesconto += r.valorDoLiq;

    if (isMat && isDesc) fatDescontoMat += r.valorOriginal;

    if (r.situacaoCurso === 'Cancelado - Curso (Assin_Cont)' && r.ra) {
      raCancelado.add(r.ra);
    }
    if (r.situacaoCurso === 'Cancelado – Curso' && r.codplanopgto) {
      planoCancelado.add(r.codplanopgto);
    }
    if (r.situacaoCurso === 'Evadido Curso') evadido += 1;
    if (r.situacaoCurso === 'Transferido de Instituição') transf += 1;

    if (r.situacaoCurso && EVASAO_STATUSES.has(r.situacaoCurso)) {
      renuncia += r.valorOriginal;
    }
  }

  const cancelado = raCancelado.size + planoCancelado.size;
  const evasaoBolsas = cancelado + evadido + transf;
  const matBeneFin = bolsas + descontos;

  return {
    matriculas: computeMatriculasCount(matriculados, filters.codperlet),
    bolsas,
    descontos,
    formados,
    fatOriginalPrevisto: fatOriginal,
    fatDescontoPrevisto: fatDesconto,
    matricCancelado: cancelado,
    matricEvadido: evadido,
    matricTransferencia: transf,
    evasaoBolsas,
    fatDescontoMatriculado: fatDescontoMat,
    matBeneFin,
    renunciaValorEvasao: renuncia,
  };
}

function groupCount(
  rows: EnrichedBolsaRow[],
  key: (r: EnrichedBolsaRow) => string,
): ChartDatum[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m, ([categoria, valor]) => ({ categoria, valor }));
}

function groupSum(
  rows: EnrichedBolsaRow[],
  key: (r: EnrichedBolsaRow) => string,
  value: (r: EnrichedBolsaRow) => number,
): ChartDatum[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + value(r));
  }
  return Array.from(m, ([categoria, valor]) => ({ categoria, valor }));
}

export function computeTopDescontos(rows: EnrichedBolsaRow[]): ChartDatum[] {
  return groupCount(
    rows.filter((r) => r.tipoBeneficio === 'Desconto'),
    (r) => r.bolsaPadronizada,
  )
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);
}

export function computeOcorrenciasBolsa(rows: EnrichedBolsaRow[]): ChartDatum[] {
  return groupCount(
    rows.filter((r) => r.tipoBeneficio === 'Bolsa'),
    (r) => r.bolsaPadronizada,
  ).sort((a, b) => b.valor - a.valor);
}

export function computeDistribuicaoBeneficios(
  rows: EnrichedBolsaRow[],
): ChartDatum[] {
  let bolsas = 0;
  let descontos = 0;
  for (const r of rows) {
    if (r.situacaoMatriculaPl !== 'Matriculado') continue;
    if (r.tipoBeneficio === 'Bolsa') bolsas += 1;
    else if (r.tipoBeneficio === 'Desconto') descontos += 1;
  }
  return [
    { categoria: 'Bolsas', valor: bolsas },
    { categoria: 'Descontos', valor: descontos },
  ];
}

export function computeTopCursosFaturamento(
  rows: EnrichedBolsaRow[],
): ChartDatum[] {
  const filtered = rows.filter(
    (r) =>
      r.tipoBeneficio === 'Desconto' &&
      r.situacaoMatriculaPl === 'Matriculado' &&
      !!r.curso,
  );
  return groupSum(
    filtered,
    (r) => r.curso ?? '',
    (r) => r.valorOriginal,
  )
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);
}

export function computeEvasaoBeneficios(
  rows: EnrichedBolsaRow[],
): ChartDatum[] {
  const filtered = rows.filter(
    (r) =>
      (r.tipoBeneficio === 'Bolsa' || r.tipoBeneficio === 'Desconto') &&
      r.situacaoCurso !== null &&
      EVASAO_STATUSES.has(r.situacaoCurso),
  );
  return groupCount(filtered, (r) => r.bolsaPadronizada)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);
}

export function computeEvasaoPorAno(
  rows: EnrichedBolsaRow[],
  tipocurso: string | null,
  bolsaPadronizada: string | null,
): EvasaoPorAnoDatum[] {
  const m = new Map<number, { matBeneFin: number; evasaoBolsas: number }>();
  for (const r of rows) {
    if (r.ano === null) continue;
    if (tipocurso && r.tipoCurso !== tipocurso) continue;
    if (bolsaPadronizada && r.bolsaPadronizada !== bolsaPadronizada) continue;

    const isBene = r.tipoBeneficio === 'Bolsa' || r.tipoBeneficio === 'Desconto';
    if (!isBene) continue;

    let acc = m.get(r.ano);
    if (!acc) {
      acc = { matBeneFin: 0, evasaoBolsas: 0 };
      m.set(r.ano, acc);
    }
    if (r.situacaoMatriculaPl === 'Matriculado') acc.matBeneFin += 1;
    if (r.situacaoCurso && EVASAO_STATUSES.has(r.situacaoCurso)) {
      acc.evasaoBolsas += 1;
    }
  }
  return Array.from(m, ([ano, v]) => ({
    ano,
    matBeneFin: v.matBeneFin,
    evasaoBolsas: v.evasaoBolsas,
  })).sort((a, b) => a.ano - b.ano);
}

export function computeEvasaoPorModalidade(
  rows: EnrichedBolsaRow[],
): ChartDatum[] {
  const filtered = rows.filter(
    (r) =>
      (r.tipoBeneficio === 'Bolsa' || r.tipoBeneficio === 'Desconto') &&
      r.situacaoCurso !== null &&
      EVASAO_STATUSES.has(r.situacaoCurso),
  );
  return groupCount(filtered, (r) => r.tipoCurso);
}

export function computeFilterOptions(rows: EnrichedBolsaRow[]): FilterOptions {
  const cp = new Set<string>();
  const anos = new Set<number>();
  const tc = new Set<string>();
  const bp = new Set<string>();
  for (const r of rows) {
    if (r.codperletNorm) cp.add(r.codperletNorm);
    if (r.ano !== null) anos.add(r.ano);
    if (r.tipoCurso) tc.add(r.tipoCurso);
    if (r.bolsaPadronizada) bp.add(r.bolsaPadronizada);
  }
  return {
    codperletOptions: Array.from(cp).sort((a, b) => b.localeCompare(a)),
    anoOptions: Array.from(anos).sort((a, b) => b - a),
    tipocursoOptions: Array.from(tc).sort(),
    bolsaPadronizadaOptions: Array.from(bp).sort(),
  };
}
