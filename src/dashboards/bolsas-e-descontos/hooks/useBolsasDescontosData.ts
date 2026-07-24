import { useCallback, useEffect, useState } from 'react';
import type {
  BolsasFilters,
  ChartDatum,
  EvasaoPorAnoDatum,
  FilterOptions,
  PanoramaKpis,
} from '../types';
import {
  fetchDistribuicaoBeneficios,
  fetchEvasaoBeneficios,
  fetchEvasaoPorAno,
  fetchEvasaoPorModalidade,
  fetchFilterOptions,
  fetchOcorrenciasBolsa,
  fetchPanoramaKpis,
  fetchTopCursosFaturamento,
  fetchTopDescontos,
} from '../queries';

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

export function useBolsasDescontosData(filters: BolsasFilters) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [panorama, setPanorama] = useState<PanoramaData | null>(null);
  const [panoramaLoading, setPanoramaLoading] = useState(false);
  const [panoramaError, setPanoramaError] = useState<string | null>(null);

  const [evasao, setEvasao] = useState<EvasaoData | null>(null);
  const [evasaoLoading, setEvasaoLoading] = useState(false);
  const [evasaoError, setEvasaoError] = useState<string | null>(null);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    setOptionsError(null);
    try {
      const opts = await fetchFilterOptions();
      setFilterOptions(opts);
    } catch (err) {
      setOptionsError(err instanceof Error ? err.message : 'Erro ao carregar filtros');
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const loadPanorama = useCallback(async () => {
    setPanoramaLoading(true);
    setPanoramaError(null);
    try {
      const [kpis, topDescontos, ocorrenciasBolsa, distribuicao, topCursosFat] = await Promise.all([
        fetchPanoramaKpis(filters),
        fetchTopDescontos(filters),
        fetchOcorrenciasBolsa(filters),
        fetchDistribuicaoBeneficios(filters),
        fetchTopCursosFaturamento(filters),
      ]);
      setPanorama({ kpis, topDescontos, ocorrenciasBolsa, distribuicao, topCursosFat });
    } catch (err) {
      setPanorama(null);
      setPanoramaError(err instanceof Error ? err.message : 'Erro ao carregar panorama');
    } finally {
      setPanoramaLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPanorama();
  }, [loadPanorama]);

  const loadEvasao = useCallback(async () => {
    setEvasaoLoading(true);
    setEvasaoError(null);
    try {
      const [kpis, evasaoBeneficios, evasaoPorAno, evasaoPorModalidade] = await Promise.all([
        fetchPanoramaKpis(filters),
        fetchEvasaoBeneficios(filters),
        fetchEvasaoPorAno(filters.tipocurso, filters.bolsaPadronizada),
        fetchEvasaoPorModalidade(filters),
      ]);
      setEvasao({
        renunciaValorEvasao: kpis.renunciaValorEvasao,
        evasaoBeneficios,
        evasaoPorAno,
        evasaoPorModalidade,
      });
    } catch (err) {
      setEvasao(null);
      setEvasaoError(err instanceof Error ? err.message : 'Erro ao carregar evasão');
    } finally {
      setEvasaoLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadEvasao();
  }, [loadEvasao]);

  return {
    filterOptions,
    optionsLoading,
    optionsError,
    panorama,
    panoramaLoading,
    panoramaError,
    evasao,
    evasaoLoading,
    evasaoError,
    refetch: () => {
      loadOptions();
      loadPanorama();
      loadEvasao();
    },
  };
}
