import { supabase } from '@/lib/supabase';

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

export async function loadAllFrom(
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

export function normalizeCodperlet(cp: string | null | undefined): string {
  return (cp ?? '').replace(/^_/, '').trim();
}
