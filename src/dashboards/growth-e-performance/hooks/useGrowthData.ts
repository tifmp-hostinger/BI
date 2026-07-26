import { useCallback, useEffect, useMemo, useState } from 'react';
import { clearGrowthCache, fetchGrowthData } from '../queries';
import { avisaAjusteManualAusente } from '../constants';
import {
  computeCampanhas,
  computeHorarios,
  computeMapa,
  computeMediaMetrics,
  computeNegocioMetrics,
  computeOrigem,
  computeSerieMensal,
} from '../calculations';
import type { GrowthDataset, GrowthFilters, GrowthView } from '../types';

type State = {
  dataset: GrowthDataset | null;
  loading: boolean;
  error: string | null;
  progress: string | null;
  atualizadoEm: Date | null;
};

/**
 * A visão ativa entra como dependência para computar apenas o que está na
 * tela (mesmo padrão do analise-de-conversao).
 */
export function useGrowthData(filters: GrowthFilters, view: GrowthView) {
  const [state, setState] = useState<State>({
    dataset: null,
    loading: true,
    error: null,
    progress: null,
    atualizadoEm: null,
  });

  const load = useCallback(async (forceRefresh: boolean) => {
    setState((s) => ({ ...s, loading: true, error: null, progress: null }));
    try {
      const dataset = await fetchGrowthData((etapa, total, descricao) => {
        setState((s) => ({
          ...s,
          progress: `Carregando dados — etapa ${etapa} de ${total} (${descricao})`,
        }));
      }, forceRefresh);
      setState({ dataset, loading: false, error: null, progress: null, atualizadoEm: new Date() });
    } catch (err) {
      setState({
        dataset: null,
        loading: false,
        progress: null,
        atualizadoEm: null,
        error: err instanceof Error ? err.message : 'Erro ao carregar dados',
      });
    }
  }, []);

  useEffect(() => {
    // Sem a env var do ajuste manual o faturamento do Pós diverge do BI em
    // silêncio — avisa uma vez na inicialização do dashboard.
    avisaAjusteManualAusente();
    load(false);
  }, [load]);

  const refetch = useCallback(() => {
    clearGrowthCache();
    load(true);
  }, [load]);

  const media = useMemo(() => {
    if (!state.dataset) return null;
    return computeMediaMetrics(state.dataset, filters);
  }, [state.dataset, filters]);

  const negocio = useMemo(() => {
    if (!state.dataset || !media) return null;
    return computeNegocioMetrics(state.dataset, filters, media);
  }, [state.dataset, filters, media]);

  const campanhas = useMemo(() => {
    if (!state.dataset || view !== 'campanhas') return null;
    return computeCampanhas(state.dataset, filters);
  }, [state.dataset, filters, view]);

  const mapa = useMemo(() => {
    if (!state.dataset || view !== 'mapa') return null;
    return computeMapa(state.dataset, filters);
  }, [state.dataset, filters, view]);

  const horarios = useMemo(() => {
    if (!state.dataset || view !== 'horarios') return null;
    return computeHorarios(state.dataset, filters);
  }, [state.dataset, filters, view]);

  const origem = useMemo(() => {
    if (!state.dataset || view !== 'origem') return null;
    return computeOrigem(state.dataset, filters);
  }, [state.dataset, filters, view]);

  const serieLeads = useMemo(() => {
    if (!state.dataset || view !== 'leads') return null;
    return computeSerieMensal(state.dataset, filters, 'leads');
  }, [state.dataset, filters, view]);

  const serieMatriculas = useMemo(() => {
    if (!state.dataset || view !== 'matriculas') return null;
    return computeSerieMensal(state.dataset, filters, 'matriculas');
  }, [state.dataset, filters, view]);

  return {
    loading: state.loading,
    error: state.error,
    progress: state.progress,
    atualizadoEm: state.atualizadoEm,
    pletivo: state.dataset?.pletivo ?? [],
    media,
    negocio,
    campanhas,
    mapa,
    horarios,
    origem,
    serieLeads,
    serieMatriculas,
    refetch,
  };
}
