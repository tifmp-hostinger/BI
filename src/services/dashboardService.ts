import { supabase, type Dashboard } from '@/lib/supabase';
import { SAMPLE_DASHBOARDS } from '@/lib/sampleData';

/**
 * Dashboards registrados em código que podem ainda não existir na tabela
 * `dashboards` do banco (o registro no banco é feito à parte). Sem este
 * merge, um dashboard novo fica roteado mas invisível no menu.
 */
const LOCAL_DASHBOARD_SLUGS = new Set(['growth-e-performance']);

function mergeLocalDashboards(fromDb: Dashboard[]): Dashboard[] {
  const dbSlugs = new Set(fromDb.map((d) => d.slug));
  const missing = SAMPLE_DASHBOARDS.filter(
    (d) => LOCAL_DASHBOARD_SLUGS.has(d.slug) && !dbSlugs.has(d.slug),
  );
  if (missing.length === 0) return fromDb;
  return [...fromDb, ...missing].sort((a, b) => a.sort_order - b.sort_order);
}

export async function listDashboards(): Promise<Dashboard[]> {
  try {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return SAMPLE_DASHBOARDS;
    }
    return mergeLocalDashboards(data as Dashboard[]);
  } catch {
    return SAMPLE_DASHBOARDS;
  }
}

export async function getDashboardBySlug(slug: string): Promise<Dashboard | null> {
  try {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return SAMPLE_DASHBOARDS.find((d) => d.slug === slug) ?? null;
    }
    return data as Dashboard;
  } catch {
    return SAMPLE_DASHBOARDS.find((d) => d.slug === slug) ?? null;
  }
}
