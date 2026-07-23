import { supabase, type UserCep } from '@/lib/supabase';
import { sampleCepsWithIds } from '@/lib/sampleData';

export type CepFilters = {
  region?: string;
  status?: string;
};

export async function listCeps(filters: CepFilters = {}): Promise<UserCep[]> {
  try {
    let query = supabase.from('user_ceps').select('*').limit(500);
    if (filters.region) query = query.eq('region', filters.region);
    if (filters.status) query = query.eq('enrollment_status', filters.status);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      let sample = sampleCepsWithIds();
      if (filters.region) sample = sample.filter((c) => c.region === filters.region);
      if (filters.status) sample = sample.filter((c) => c.enrollment_status === filters.status);
      return sample;
    }
    return data as UserCep[];
  } catch {
    let sample = sampleCepsWithIds();
    if (filters.region) sample = sample.filter((c) => c.region === filters.region);
    if (filters.status) sample = sample.filter((c) => c.enrollment_status === filters.status);
    return sample;
  }
}

export type CepAggregates = {
  total: number;
  activeUsers: number;
  prospectUsers: number;
  alumniUsers: number;
  stateCount: number;
  cityCount: number;
  byRegion: Array<{ name: string; value: number }>;
  byState: Array<{ name: string; value: number }>;
  byAgeGroup: Array<{ name: string; value: number }>;
  byProgram: Array<{ name: string; value: number }>;
  topCities: Array<{ name: string; value: number; state: string }>;
};

export function aggregate(ceps: UserCep[]): CepAggregates {
  const byRegionMap = new Map<string, number>();
  const byStateMap = new Map<string, number>();
  const byAgeMap = new Map<string, number>();
  const byProgramMap = new Map<string, number>();
  const byCityMap = new Map<string, { count: number; state: string }>();

  let activeUsers = 0;
  let prospectUsers = 0;
  let alumniUsers = 0;

  for (const c of ceps) {
    byRegionMap.set(c.region, (byRegionMap.get(c.region) ?? 0) + 1);
    byStateMap.set(c.state, (byStateMap.get(c.state) ?? 0) + 1);
    byAgeMap.set(c.age_group, (byAgeMap.get(c.age_group) ?? 0) + 1);
    byProgramMap.set(c.program, (byProgramMap.get(c.program) ?? 0) + 1);

    const existing = byCityMap.get(c.city);
    if (existing) existing.count += 1;
    else byCityMap.set(c.city, { count: 1, state: c.state });

    if (c.enrollment_status === 'active') activeUsers += 1;
    else if (c.enrollment_status === 'prospect') prospectUsers += 1;
    else if (c.enrollment_status === 'alumni') alumniUsers += 1;
  }

  const byRegion = Array.from(byRegionMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const byState = Array.from(byStateMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  const byAgeGroup = ['18-24', '25-34', '35-44', '45-54', '55+'].map((k) => ({
    name: k,
    value: byAgeMap.get(k) ?? 0,
  }));
  const byProgram = Array.from(byProgramMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const topCities = Array.from(byCityMap.entries())
    .map(([name, v]) => ({ name, value: v.count, state: v.state }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    total: ceps.length,
    activeUsers,
    prospectUsers,
    alumniUsers,
    stateCount: byStateMap.size,
    cityCount: byCityMap.size,
    byRegion,
    byState,
    byAgeGroup,
    byProgram,
    topCities,
  };
}
