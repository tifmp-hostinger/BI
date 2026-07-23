import { supabase, type Dashboard } from '@/lib/supabase';
import { SAMPLE_DASHBOARDS } from '@/lib/sampleData';

export async function listDashboards(): Promise<Dashboard[]> {
  try {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return SAMPLE_DASHBOARDS;
    }
    return data as Dashboard[];
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
