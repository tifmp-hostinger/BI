import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BolsasFilters,
  ChartDatum,
  EnrichedBolsaRow,
  EvasaoPorAnoDatum,
  FilterOptions,
  MatriculadosData,
  PanoramaKpis,
} from '../types';
import {
  applyFilters,
  buildDimMap,
  computeDistribuicaoBeneficios,
  computeEvasaoBeneficios,
  computeEvasaoPorAno,
  computeEvasaoPorModalidade,
  computeFilterOptions,
  computeOcorrenciasBolsa,
  computePanoramaKpis,
  computeTopCursosFaturamento,
  computeTopDescontos,
  enrichBolsaRows,
} from '../calculations';
import {
  fetchBolsasRaw,
  fetchDimBeneficio,
  fetchMatriculadosGrad,
  fetchMatriculadosMestrado,
  fetchMatriculadosPos,
} from '../queries';
import { ritmoDoDataset, type RitmoFonte } from '@/lib/dataFreshness';

type PanoramaData = {
  kpis: PanoramaKpis;
  topDescontos: ChartDatum[];
  ocorrenciasBolsa: ChartDatum[];
  distribuicao: ChartDatum[];
  topCursosFat: ChartDatum[];
};

type EvasaoData = {
  evasaoBeneficios: ChartDatum[];
  evasaoPorAno: EvasaoPorAnoDatum[];
  evasaoPorModalidade: ChartDatum[];
  renunciaValorEvasao: number;
};

type Dataset = {
  enrichedRows: EnrichedBolsaRow[];
  matriculados: MatriculadosData;
  filterOptions: FilterOptions;
  freshnessRitmos: Record<string, RitmoFonte>;
};

export function useBolsasDescontosData(filters: BolsasFilters) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dim, raw, grad, pos, mestrado] = await Promise.all([
        fetchDimBeneficio(),
        fetchBolsasRaw(),
        fetchMatriculadosGrad(),
        fetchMatriculadosPos(),
        fetchMatriculadosMestrado(),
      ]);
      const dimMap = buildDimMap(dim);
      const enrichedRows = enrichBolsaRows(raw, dimMap);
      const matriculados: MatriculadosData = { grad, pos, mestrado };
      const filterOptions = computeFilterOptions(enrichedRows);
      // Proxy de frescor: sobre o dataset bruto, antes do enriquecimento
      // descartar a coluna de data — nunca dispara consulta nova.
      const freshnessRitmos: Record<string, RitmoFonte> = {
        stg_rm_matriculas_bolsas: ritmoDoDataset(raw, 'data_matricula'),
        stg_rm_matriculas_grad: ritmoDoDataset(grad, 'data'),
        stg_rm_matriculas_pos: ritmoDoDataset(pos, 'data'),
        stg_rm_matriculas_mestrado: ritmoDoDataset(mestrado, 'data'),
      };
      setDataset({ enrichedRows, matriculados, filterOptions, freshnessRitmos });
    } catch (err) {
      setDataset(null);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = useMemo<EnrichedBolsaRow[] | null>(() => {
    if (!dataset) return null;
    return applyFilters(dataset.enrichedRows, filters);
  }, [dataset, filters]);

  const kpis = useMemo<PanoramaKpis | null>(() => {
    if (!dataset || !filtered) return null;
    return computePanoramaKpis(filtered, dataset.matriculados, filters);
  }, [dataset, filtered, filters]);

  const panorama = useMemo<PanoramaData | null>(() => {
    if (!filtered || !kpis) return null;
    return {
      kpis,
      topDescontos: computeTopDescontos(filtered),
      ocorrenciasBolsa: computeOcorrenciasBolsa(filtered),
      distribuicao: computeDistribuicaoBeneficios(filtered),
      topCursosFat: computeTopCursosFaturamento(filtered),
    };
  }, [filtered, kpis]);

  const evasao = useMemo<EvasaoData | null>(() => {
    if (!dataset || !filtered || !kpis) return null;
    return {
      evasaoBeneficios: computeEvasaoBeneficios(filtered),
      evasaoPorAno: computeEvasaoPorAno(filtered),
      evasaoPorModalidade: computeEvasaoPorModalidade(filtered),
      renunciaValorEvasao: kpis.renunciaValorEvasao,
    };
  }, [dataset, filtered, kpis]);

  return {
    filterOptions: dataset?.filterOptions ?? null,
    optionsLoading: loading,
    optionsError: error,
    panorama,
    panoramaLoading: loading,
    panoramaError: error,
    evasao,
    evasaoLoading: loading,
    evasaoError: error,
    freshnessRitmos: dataset?.freshnessRitmos ?? {},
    refetch: loadAll,
  };
}
