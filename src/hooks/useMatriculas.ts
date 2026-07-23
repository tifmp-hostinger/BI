import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  aggregate,
  detailForState,
  listMatriculas,
  type Matricula,
  type MatriculaSource,
} from '@/services/matriculasService';
import { regionOf } from '@/lib/brStates';

export type MatriculaFilters = {
  source?: MatriculaSource | 'all';
  region?: string;
  onlyMatriculados?: boolean;
};

type State = {
  raw: Matricula[];
  loading: boolean;
  error: string | null;
};

export function useMatriculas(filters: MatriculaFilters) {
  const [state, setState] = useState<State>({
    raw: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const raw = await listMatriculas();
      setState({ raw, loading: false, error: null });
    } catch (err) {
      setState({
        raw: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Erro ao carregar matriculas',
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let d = state.raw;
    if (filters.source && filters.source !== 'all') {
      d = d.filter((m) => m.source === filters.source);
    }
    if (filters.region) {
      d = d.filter((m) => regionOf(m.estado) === filters.region);
    }
    if (filters.onlyMatriculados) {
      d = d.filter((m) => m.situacao.toLowerCase().startsWith('matricula'));
    }
    return d;
  }, [state.raw, filters.source, filters.onlyMatriculados, filters.region]);

  const stats = useMemo(() => aggregate(filtered), [filtered]);

  const detailFor = useCallback(
    (uf: string) => detailForState(filtered, uf),
    [filtered]
  );

  return {
    raw: state.raw,
    filtered,
    loading: state.loading,
    error: state.error,
    stats,
    detailFor,
    refetch: load,
  };
}
