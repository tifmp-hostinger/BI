import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  computeEspecializacoesKpis,
  computeGraduacaoKpis,
  computeMestradoKpis,
  graduacaoDateRangeFromPletivos,
} from '../calculations';
import { ritmoDoDataset, type RitmoFonte } from '@/lib/dataFreshness';
import {
  fetchInscricoesGraduacao,
  fetchInscricoesMestrado,
  fetchMatriculasGraduacao,
  fetchMatriculasMestrado,
  fetchMatriculasPos,
  fetchRubeusLeadsGraduacao,
  fetchRubeusLeadsMestrado,
  listMetasMestrado,
  listMetasPos,
  listPletivos,
} from '../queries';
import type {
  EspecializacoesKpis,
  GraduacaoKpis,
  InscricaoRow,
  MatriculaGradRow,
  MatriculaMestradoRow,
  MatriculaPosRow,
  MestradoKpis,
  MetaMestrado,
  MetaPos,
  PeriodoLetivo,
} from '../types';

type BaseData = {
  pletivos: PeriodoLetivo[];
  metaMestrado: MetaMestrado[];
  metaPos: MetaPos[];
  inscricoesGrad: InscricaoRow[];
  inscricoesMest: InscricaoRow[];
  matriculasGrad: MatriculaGradRow[];
  matriculasMest: MatriculaMestradoRow[];
  matriculasPos: MatriculaPosRow[];
};

export function useAnaliseConversaoData(options: {
  periodoGradAtual: string;
  periodoGradAnterior: string;
  anoMestrado: number;
  anoPos: number;
  mesesPos: number[];
}) {
  const {
    periodoGradAtual,
    periodoGradAnterior,
    anoMestrado,
    anoPos,
    mesesPos,
  } = options;

  const [base, setBase] = useState<BaseData | null>(null);
  const [baseLoading, setBaseLoading] = useState(true);
  const [baseError, setBaseError] = useState<string | null>(null);

  const [rubeusGradAtual, setRubeusGradAtual] = useState<GraduacaoKpis['leads'] | null>(null);
  const [rubeusGradAnterior, setRubeusGradAnterior] = useState<GraduacaoKpis['leads'] | null>(null);
  const [rubeusMestrado, setRubeusMestrado] = useState<MestradoKpis['leads'] | null>(null);

  const [rubeusLoading, setRubeusLoading] = useState(false);
  const [rubeusError, setRubeusError] = useState<string | null>(null);

  // Nota: como o denominador da conversao da Graduacao usa o nome_lead vindo do
  // Rubeus (nao apenas a contagem), guardamos os arrays reais tambem.
  const [rubeusGradAtualRows, setRubeusGradAtualRows] = useState<
    Awaited<ReturnType<typeof fetchRubeusLeadsGraduacao>>
  >([]);
  const [rubeusGradAnteriorRows, setRubeusGradAnteriorRows] = useState<
    Awaited<ReturnType<typeof fetchRubeusLeadsGraduacao>>
  >([]);
  const [rubeusMestradoRows, setRubeusMestradoRows] = useState<
    Awaited<ReturnType<typeof fetchRubeusLeadsMestrado>>
  >([]);

  const loadBase = useCallback(async () => {
    setBaseLoading(true);
    setBaseError(null);
    try {
      const [
        pletivos,
        metaMestrado,
        metaPos,
        inscricoesGrad,
        inscricoesMest,
        matriculasGrad,
        matriculasMest,
        matriculasPos,
      ] = await Promise.all([
        listPletivos(),
        listMetasMestrado(),
        listMetasPos(),
        fetchInscricoesGraduacao(),
        fetchInscricoesMestrado(),
        fetchMatriculasGraduacao(),
        fetchMatriculasMestrado(),
        fetchMatriculasPos(),
      ]);
      setBase({
        pletivos,
        metaMestrado,
        metaPos,
        inscricoesGrad,
        inscricoesMest,
        matriculasGrad,
        matriculasMest,
        matriculasPos,
      });
    } catch (err) {
      setBase(null);
      setBaseError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setBaseLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  // Rubeus depende dos pletivos (para faixa de datas de graduacao) e dos anos.
  useEffect(() => {
    if (!base) return;
    let cancelled = false;
    async function run() {
      setRubeusLoading(true);
      setRubeusError(null);
      try {
        const rangeAtual = graduacaoDateRangeFromPletivos(
          base!.pletivos,
          periodoGradAtual
        );
        const rangeAnterior = graduacaoDateRangeFromPletivos(
          base!.pletivos,
          periodoGradAnterior
        );

        const [gradAtual, gradAnterior, mestrado] = await Promise.all([
          rangeAtual
            ? fetchRubeusLeadsGraduacao(rangeAtual.dataInicio, rangeAtual.dataFim)
            : Promise.resolve([]),
          rangeAnterior
            ? fetchRubeusLeadsGraduacao(rangeAnterior.dataInicio, rangeAnterior.dataFim)
            : Promise.resolve([]),
          fetchRubeusLeadsMestrado(anoMestrado),
        ]);

        if (cancelled) return;
        setRubeusGradAtualRows(gradAtual);
        setRubeusGradAnteriorRows(gradAnterior);
        setRubeusMestradoRows(mestrado);
        setRubeusGradAtual(gradAtual.length);
        setRubeusGradAnterior(gradAnterior.length);
        setRubeusMestrado(mestrado.length);
      } catch (err) {
        if (cancelled) return;
        setRubeusError(err instanceof Error ? err.message : 'Erro ao carregar leads');
      } finally {
        if (!cancelled) setRubeusLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [base, periodoGradAtual, periodoGradAnterior, anoMestrado]);

  const graduacaoAtual: GraduacaoKpis | null = useMemo(() => {
    if (!base) return null;
    const pletivo = base.pletivos.find((p) => p.periodo === periodoGradAtual) ?? null;
    return computeGraduacaoKpis(
      periodoGradAtual,
      pletivo,
      rubeusGradAtualRows,
      base.inscricoesGrad,
      base.matriculasGrad
    );
  }, [base, periodoGradAtual, rubeusGradAtualRows]);

  const graduacaoAnterior: GraduacaoKpis | null = useMemo(() => {
    if (!base) return null;
    const pletivo = base.pletivos.find((p) => p.periodo === periodoGradAnterior) ?? null;
    return computeGraduacaoKpis(
      periodoGradAnterior,
      pletivo,
      rubeusGradAnteriorRows,
      base.inscricoesGrad,
      base.matriculasGrad
    );
  }, [base, periodoGradAnterior, rubeusGradAnteriorRows]);

  const mestrado: MestradoKpis | null = useMemo(() => {
    if (!base) return null;
    const meta = base.metaMestrado.find((m) => m.ano === anoMestrado) ?? null;
    return computeMestradoKpis(
      anoMestrado,
      meta,
      rubeusMestradoRows,
      base.inscricoesMest,
      base.matriculasMest
    );
  }, [base, anoMestrado, rubeusMestradoRows]);

  const especializacoes: EspecializacoesKpis | null = useMemo(() => {
    if (!base) return null;
    return computeEspecializacoesKpis(
      anoPos,
      mesesPos,
      base.metaPos,
      base.matriculasPos
    );
  }, [base, anoPos, mesesPos]);

  /**
   * Proxy de frescor por tabela, sobre o dataset SEM filtro de usuário
   * (base é o download completo) — nunca dispara consulta nova.
   */
  const freshnessRitmos = useMemo((): Record<string, RitmoFonte> => {
    if (!base) return {};
    return {
      stg_rm_matriculas_grad: ritmoDoDataset(base.matriculasGrad, 'datamatricula'),
      stg_rm_matriculas_mestrado: ritmoDoDataset(base.matriculasMest, 'datamatricula'),
      stg_rm_matriculas_pos: ritmoDoDataset(base.matriculasPos, 'datadematricula'),
      stg_rm_inscricoes_graduacao: ritmoDoDataset(base.inscricoesGrad, 'datainscricao'),
      stg_rm_inscricoes_mestrado: ritmoDoDataset(base.inscricoesMest, 'datainscricao'),
    };
  }, [base]);

  return {
    base,
    loading: baseLoading,
    error: baseError,
    rubeusLoading,
    rubeusError,
    refetch: loadBase,
    graduacaoAtual,
    graduacaoAnterior,
    mestrado,
    especializacoes,
    freshnessRitmos,
    // exposto para debug/telemetria
    rubeusCounts: {
      gradAtual: rubeusGradAtual,
      gradAnterior: rubeusGradAnterior,
      mestrado: rubeusMestrado,
    },
  };
}
