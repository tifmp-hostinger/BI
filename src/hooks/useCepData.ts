import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UserCep } from '@/lib/supabase';
import { aggregate, listCeps, type CepFilters } from '@/services/cepService';

type State = {
  data: UserCep[];
  loading: boolean;
  error: string | null;
};

export function useCepData(filters: CepFilters = {}) {
  const [state, setState] = useState<State>({
    data: [],
    loading: true,
    error: null,
  });

  const stableFilters = useMemo(
    () => ({ region: filters.region, status: filters.status }),
    [filters.region, filters.status]
  );

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await listCeps(stableFilters);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Erro ao carregar dados',
      });
    }
  }, [stableFilters]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => aggregate(state.data), [state.data]);

  return { ...state, stats, refetch: load };
}
