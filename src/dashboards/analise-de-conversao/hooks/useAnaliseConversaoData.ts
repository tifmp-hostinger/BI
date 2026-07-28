import { useCallback, useEffect, useMemo, useState } from 'react';
import { clearDashboardCache, fetchDashboardData } from '../queries';
import { maiorDataDoDataset } from '@/lib/dataFreshness';
import {
  buildFilterOptions,
  computeCursosLivresData,
  computeEspecializacoesData,
  computeGeralKpis,
  computeGraduacaoData,
  computeLeadsData,
  computeMestradoData,
  computeModalidadePosData,
  computeRematriculaData,
} from '../calculations';
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

export type ConversaoTab =
  | 'geral'
  | 'leads'
  | 'graduacao'
  | 'rematricula'
  | 'especializacoes'
  | 'presencial'
  | 'ead'
  | 'cursoslivres'
  | 'mestrado';

type State = {
  dataset: DashboardDataset | null;
  loading: boolean;
  error: string | null;
  progress: string | null;
};

/**
 * Recebe a aba ativa: cada bloco de dados só é computado quando a sua aba
 * está visível. Antes, qualquer mudança de filtro recalculava as 9 abas de
 * uma vez (varrendo centenas de milhares de linhas ~10x), travando a UI.
 */
export function useAnaliseConversaoData(filters: ConversaoFilters, tab: ConversaoTab) {
  const [state, setState] = useState<State>({
    dataset: null,
    loading: true,
    error: null,
    progress: null,
  });

  const load = useCallback(async (forceRefresh: boolean) => {
    setState((s) => ({ ...s, loading: true, error: null, progress: null }));
    try {
      const dataset = await fetchDashboardData((etapa, total, descricao) => {
        setState((s) => ({
          ...s,
          progress: `Carregando dados — etapa ${etapa} de ${total} (${descricao})`,
        }));
      }, forceRefresh);
      setState({ dataset, loading: false, error: null, progress: null });
    } catch (err) {
      setState({
        dataset: null,
        loading: false,
        progress: null,
        error: err instanceof Error ? err.message : 'Erro ao carregar dados',
      });
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const refetch = useCallback(() => {
    clearDashboardCache();
    load(true);
  }, [load]);

  const filterOptions: FilterOptions | null = useMemo(() => {
    if (!state.dataset) return null;
    return buildFilterOptions(state.dataset);
  }, [state.dataset]);

  const geralKpis: GeralKpis | null = useMemo(() => {
    if (!state.dataset || tab !== 'geral') return null;
    return computeGeralKpis(state.dataset, filters);
  }, [state.dataset, filters, tab]);

  const leadsData: LeadsData | null = useMemo(() => {
    if (!state.dataset || tab !== 'leads') return null;
    return computeLeadsData(state.dataset, filters);
  }, [state.dataset, filters, tab]);

  const graduacaoData: GraduacaoData | null = useMemo(() => {
    if (!state.dataset || tab !== 'graduacao') return null;
    return computeGraduacaoData(state.dataset, filters);
  }, [state.dataset, filters, tab]);

  const rematriculaData: RematriculaData | null = useMemo(() => {
    if (!state.dataset || tab !== 'rematricula') return null;
    return computeRematriculaData(state.dataset, filters);
  }, [state.dataset, filters, tab]);

  const mestradoData: MestradoData | null = useMemo(() => {
    if (!state.dataset || tab !== 'mestrado') return null;
    return computeMestradoData(state.dataset, filters);
  }, [state.dataset, filters, tab]);

  const especializacoesData: EspecializacoesData | null = useMemo(() => {
    if (!state.dataset || tab !== 'especializacoes') return null;
    return computeEspecializacoesData(state.dataset, filters);
  }, [state.dataset, filters, tab]);

  const presencialData: ModalidadePosData | null = useMemo(() => {
    if (!state.dataset || tab !== 'presencial') return null;
    return computeModalidadePosData(state.dataset, filters, 'Pós Presencial');
  }, [state.dataset, filters, tab]);

  const eadData: ModalidadePosData | null = useMemo(() => {
    if (!state.dataset || tab !== 'ead') return null;
    return computeModalidadePosData(state.dataset, filters, 'Pós EAD');
  }, [state.dataset, filters, tab]);

  const cursosLivresData: CursosLivresData | null = useMemo(() => {
    if (!state.dataset || tab !== 'cursoslivres') return null;
    return computeCursosLivresData(state.dataset, filters);
  }, [state.dataset, filters, tab]);

  /**
   * Proxy de frescor por tabela, sobre o dataset SEM filtro de usuário
   * (state.dataset é o download completo) — nunca dispara consulta nova.
   */
  const freshnessProxies = useMemo((): Record<string, Date | null> => {
    const ds = state.dataset;
    if (!ds) return {};
    return {
      stg_rm_matriculas_grad: maiorDataDoDataset(ds.matriculasGrad, 'datamatricula'),
      stg_rm_matriculas_mestrado: maiorDataDoDataset(ds.matriculasMestrado, 'datamatricula'),
      stg_rm_matriculas_pos: maiorDataDoDataset(ds.matriculasPos, 'datadematricula'),
      stg_rm_matriculas_cursoslivres: maiorDataDoDataset(ds.matriculasCursosLives, 'data_contrato'),
      stg_rm_inscricoes_graduacao: maiorDataDoDataset(ds.inscricoesGrad, 'datainscricao'),
      stg_rm_inscricoes_mestrado: maiorDataDoDataset(ds.inscricoesMestrado, 'datainscricao'),
      stg_rm_inscricoes_pos: maiorDataDoDataset(ds.inscricoesPos, 'datainscricao'),
      stg_rm_inscricoes_cursoslivres: maiorDataDoDataset(ds.clInscPorDia, 'data'),
    };
  }, [state.dataset]);

  return {
    loading: state.loading,
    error: state.error,
    progress: state.progress,
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
    freshnessProxies,
    refetch,
  };
}
