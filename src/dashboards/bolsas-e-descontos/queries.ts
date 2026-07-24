import { supabase } from '@/lib/supabase';
import type { MatriculadoRow, RawBolsaRow, RawDimBeneficio } from './types';

const PAGE_SIZE = 1000;
const PAGE_CONCURRENCY = 8;

type Where = { column: string; value: string };

async function fetchCount(table: string, where?: Where): Promise<number> {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (where) q = q.eq(where.column, where.value);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function fetchPage(
  table: string,
  columns: string,
  from: number,
  where?: Where,
): Promise<unknown[]> {
  let q = supabase.from(table).select(columns);
  if (where) q = q.eq(where.column, where.value);
  const { data, error } = await q.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return (data ?? []) as unknown[];
}

async function loadAllFrom(
  table: string,
  columns: string,
  where?: Where,
): Promise<unknown[]> {
  const total = await fetchCount(table, where);
  if (total === 0) return [];
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const out: unknown[] = [];
  for (let start = 0; start < pageCount; start += PAGE_CONCURRENCY) {
    const batch: Promise<unknown[]>[] = [];
    for (let i = start; i < Math.min(start + PAGE_CONCURRENCY, pageCount); i++) {
      batch.push(fetchPage(table, columns, i * PAGE_SIZE, where));
    }
    const results = await Promise.all(batch);
    for (const rows of results) out.push(...rows);
  }
  return out;
}

export async function fetchDimBeneficio(): Promise<RawDimBeneficio[]> {
  const rows = await loadAllFrom(
    'dim_tipo_beneficio',
    'valor_original_rm, tipo_beneficio_padronizado',
  );
  return rows as RawDimBeneficio[];
}

export async function fetchBolsasRaw(): Promise<RawBolsaRow[]> {
  const cols =
    'ra, curso, codperlet, situacao_curso, situacao_matriculapl, bolsa, codplanopgto, valororiginal, valordoliq';
  const rows = await loadAllFrom('stg_rm_matriculas_bolsas', cols);
  return rows as RawBolsaRow[];
}

function toMatriculadoRows(
  rows: unknown[],
): MatriculadoRow[] {
  const out: MatriculadoRow[] = [];
  for (const raw of rows) {
    const r = raw as { ra: string | null; codperlet: string | null };
    if (!r.ra) continue;
    const cp = (r.codperlet ?? '').replace(/^_/, '').trim();
    out.push({ ra: r.ra, codperletNorm: cp });
  }
  return out;
}

export async function fetchMatriculadosGrad(): Promise<MatriculadoRow[]> {
  const rows = await loadAllFrom('stg_rm_matriculas_grad', 'ra, codperlet', {
    column: 'situacao',
    value: 'Matriculado',
  });
  return toMatriculadoRows(rows);
}

export async function fetchMatriculadosPos(): Promise<MatriculadoRow[]> {
  const rows = await loadAllFrom('stg_rm_matriculas_pos', 'ra, codperlet', {
    column: 'situacao',
    value: 'Matriculado',
  });
  return toMatriculadoRows(rows);
}

export async function fetchMatriculadosMestrado(): Promise<MatriculadoRow[]> {
  const rows = await loadAllFrom(
    'stg_rm_matriculas_mestrado',
    'ra, codperlet',
    { column: 'situacao', value: 'Matriculado' },
  );
  return toMatriculadoRows(rows);
}
