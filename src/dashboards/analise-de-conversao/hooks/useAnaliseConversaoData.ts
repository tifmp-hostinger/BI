import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDashboardData } from '../queries';
import { buildFilterOptions, computeCursosLivresData, computeEspecializacoesData, computeGeralKpis, computeGraduacaoData, computeLeadsData, computeMestradoData, computeModalidadePosData, computeRematriculaData } from '../calculations';
import type {
  ConversaoFilters,
  CursosLivresData,
  DashboardDataset,
  EspecializacoesData,
  FilterOptions,
  GeralKpis,
  GraduacaoData,
  LeadsData,
  MestradoData,
  ModalidadePosData,
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

  const especializacoesData: EspecializacoesData | null = useMemo(() => {
    if (!state.dataset) return null;
    return computeEspecializacoesData(state.dataset, filters);
  }, [state.dataset, filters]);

  const presencialData: ModalidadePosData | null = useMemo(() => {
    if (!state.dataset) return null;
    return computeModalidadePosData(state.dataset, filters, 'Pós Presencial');
  }, [state.dataset, filters]);

  const eadData: ModalidadePosData | null = useMemo(() => {
    if (!state.dataset) return null;
    return computeModalidadePosData(state.dataset, filters, 'Pós EAD');
  }, [state.dataset, filters]);

  const cursosLivresData: CursosLivresData | null = useMemo(() => {
    if (!state.dataset) return null;
    return computeCursosLivresData(state.dataset, filters);
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
    especializacoesData,
    presencialData,
    eadData,
    cursosLivresData,
    refetch: load,
  };
}
