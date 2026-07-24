import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDashboardData } from '../queries';
import { buildFilterOptions, computeGeralKpis, computeGraduacaoData, computeLeadsData, computeMestradoData, computeRematriculaData } from '../calculations';
import type {
  ConversaoFilters,
  DashboardDataset,
  FilterOptions,
  GeralKpis,
  GraduacaoData,
  LeadsData,
  MestradoData,
  RematriculaData,
} from '../types';

type State = {
  dataset: DashboardDataset | null;
  loading: boolean;
  error: string | null;
};

export function useAnaliseConversaoData(filters: ConversaoFilters) {
  const [state, setState] = useState<State>({
    dataset: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const dataset = await fetchDashboardData();
      setState({ dataset, loading: false, error: null });
    } catch (err) {
      setState({
        dataset: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Erro ao carregar dados',
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filterOptions: FilterOptions | null = useMemo(() => {
    if (!state.dataset) return null;
    return buildFilterOptions(state.dataset);
  }, [state.dataset]);

  const geralKpis: GeralKpis | null = useMemo(() => {
    if (!state.dataset) return null;
    return computeGeralKpis(state.dataset, filters);
  }, [state.dataset, filters]);

  const leadsData: LeadsData | null = useMemo(() => {
    if (!state.dataset) return null;
    return computeLeadsData(state.dataset, filters);
  }, [state.dataset, filters]);

  const graduacaoData: GraduacaoData | null = useMemo(() => {
    if (!state.dataset) return null;
    return computeGraduacaoData(state.dataset, filters);
  }, [state.dataset, filters]);

  const rematriculaData: RematriculaData | null = useMemo(() => {
    if (!state.dataset) return null;
    return computeRematriculaData(state.dataset, filters);
  }, [state.dataset, filters]);

  const mestradoData: MestradoData | null = useMemo(() => {
    if (!state.dataset) return null;
    return computeMestradoData(state.dataset, filters);
  }, [state.dataset, filters]);

  return {
    loading: state.loading,
    error: state.error,
    filterOptions,
    geralKpis,
    leadsData,
    graduacaoData,
    rematriculaData,
    mestradoData,
    refetch: load,
  };
}
