import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Target } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BarraContexto } from '@/components/layout/BarraContexto';
import { ErrorState } from '@/components/ui/ErrorState';
import { FONTES_POR_DASHBOARD } from '@/lib/dataFreshness';
import { EspecializacoesBlock } from './components/EspecializacoesBlock';
import { GraduacaoBlock } from './components/GraduacaoBlock';
import { MestradoBlock } from './components/MestradoBlock';
import {
  escolhePeriodosPadrao,
  useAnaliseConversaoData,
} from './hooks/useAnaliseConversaoData';

/**
 * Meses padrão por ano (regra herdada do Power BI): ano corrente vai até o
 * mês atual; ano passado cobre os 12 meses (comparar 8 meses de 2026 com 8
 * de 2025 induzia a ler um faturamento anual menor sem perceber); ano futuro
 * também abre com os 12 para não mostrar card vazio.
 */
function defaultMesesAte(anoAlvo: number, hoje = new Date()): number[] {
  const anoAtual = hoje.getFullYear();
  if (anoAlvo !== anoAtual) return Array.from({ length: 12 }, (_, i) => i + 1);
  return Array.from({ length: hoje.getMonth() + 1 }, (_, i) => i + 1);
}

export function AnaliseConversaoPresidenciaPage() {
  const anoAtual = new Date().getFullYear();

  const [periodoGradAtual, setPeriodoGradAtual] = useState<string>('26-01');
  const [periodoGradAnterior, setPeriodoGradAnterior] = useState<string>('25-02');
  const [anoMestrado, setAnoMestrado] = useState<number>(anoAtual);
  const [anoPos, setAnoPos] = useState<number>(anoAtual);
  const [mesesPos, setMesesPos] = useState<number[]>(defaultMesesAte(anoAtual));
  const [defaultsAplicados, setDefaultsAplicados] = useState(false);

  const {
    base,
    loading,
    error,
    rubeusLoading,
    rubeusError,
    refetch,
    revalidando,
    graduacaoAtual,
    graduacaoAnterior,
    mestrado,
    especializacoes,
    freshnessRitmos,
  } = useAnaliseConversaoData({
    periodoGradAtual,
    periodoGradAnterior,
    anoMestrado,
    anoPos,
    mesesPos,
  });

  if (base && !defaultsAplicados) {
    const { atual, anterior } = escolhePeriodosPadrao(base.pletivos);
    if (atual !== periodoGradAtual) setPeriodoGradAtual(atual);
    if (anterior !== periodoGradAnterior) setPeriodoGradAnterior(anterior);
    // Ano sem meta cadastrada (típico na virada do ano): cai para o ano mais
    // recente COM meta — senão o select renderia um ano fora das opções e os
    // KPIs abririam vazios.
    const anosComMetaMest = base.metaMestrado.map((m) => m.ano);
    if (anosComMetaMest.length > 0 && !anosComMetaMest.includes(anoMestrado)) {
      setAnoMestrado(Math.max(...anosComMetaMest));
    }
    const anosComMetaPos = base.metaPos.map((m) => m.ano);
    if (anosComMetaPos.length > 0 && !anosComMetaPos.includes(anoPos)) {
      const alvo = Math.max(...anosComMetaPos);
      setAnoPos(alvo);
      setMesesPos(defaultMesesAte(alvo));
    }
    setDefaultsAplicados(true);
  }

  // Trocar o ano das Especializações recalcula os meses padrão daquele ano —
  // antes a seleção de meses ficava congelada e comparar 2025 com jan-ago
  // passava um faturamento anual errado sem aviso.
  const trocaAnoPos = (ano: number) => {
    setAnoPos(ano);
    setMesesPos(defaultMesesAte(ano));
  };

  const anosMestrado = useMemo(() => {
    if (!base) return [anoAtual];
    const set = new Set<number>();
    base.metaMestrado.forEach((m) => set.add(m.ano));
    if (set.size === 0) set.add(anoAtual);
    return Array.from(set).sort((a, b) => b - a);
  }, [base, anoAtual]);

  const anosPos = useMemo(() => {
    if (!base) return [anoAtual];
    const set = new Set<number>();
    base.metaPos.forEach((m) => set.add(m.ano));
    if (set.size === 0) set.add(anoAtual);
    return Array.from(set).sort((a, b) => b - a);
  }, [base, anoAtual]);

  const rubeusFalha = rubeusError && !rubeusLoading;

  return (
    <AppShell
      title="Análise de Conversão - Presidência"
      subtitle="Funil comercial acadêmico: leads, inscrições, matrículas"
    >
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Sem card-herói aqui de propósito: a hierarquia deste painel já
            é o gauge de % da meta dentro de cada bloco. Eleger um número
            entre Graduação, Mestrado e Especializações seria escolha
            arbitrária, não leitura do dado. */}
        <BarraContexto
          descricao="Como estão leads, inscrições e matrículas frente às metas de Graduação, Mestrado e Especializações, em uma única tela e sem expor dados pessoais. Alguns indicadores seguem regras históricas do modelo anterior, mantidas de propósito para os números continuarem comparáveis."
          tabelas={FONTES_POR_DASHBOARD['analise-conversao-presidencia']}
          ritmos={freshnessRitmos}
          revalidando={revalidando}
          onAtualizar={refetch}
        />

        {error && (
          <ErrorState
            title="Não foi possível carregar os dados"
            message={error}
            onRetry={refetch}
          />
        )}

        {rubeusFalha && (
          <div className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning-light p-4 text-warning-dark shadow-card">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Leads (Rubeus) indisponíveis</p>
              <p className="text-2xs">
                Os demais indicadores continuam sendo exibidos. {rubeusError}
              </p>
            </div>
          </div>
        )}

        {/* Blocos */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GraduacaoBlock
            title="Graduação - Período Atual"
            subtitle="Vestibular vigente"
            kpis={graduacaoAtual}
            pletivos={base?.pletivos ?? []}
            periodo={periodoGradAtual}
            onPeriodoChange={setPeriodoGradAtual}
            loading={loading || rubeusLoading}
            comparacao={graduacaoAnterior}
          />
          <EspecializacoesBlock
            kpis={especializacoes}
            anos={anosPos}
            ano={anoPos}
            onAnoChange={trocaAnoPos}
            meses={mesesPos}
            onMesesChange={setMesesPos}
            loading={loading}
          />
          <GraduacaoBlock
            title="Graduação - Período Anterior"
            subtitle="Referência de comparação dos chips ▲/▼"
            kpis={graduacaoAnterior}
            pletivos={base?.pletivos ?? []}
            periodo={periodoGradAnterior}
            onPeriodoChange={setPeriodoGradAnterior}
            loading={loading || rubeusLoading}
          />
          <MestradoBlock
            kpis={mestrado}
            anos={anosMestrado}
            ano={anoMestrado}
            onAnoChange={setAnoMestrado}
            loading={loading || rubeusLoading}
          />
        </div>

        <section className="rounded-md border border-dashed border-fmp/30 bg-fmp-muted p-5 animate-fade-in">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-sm bg-card p-2 text-fmp shadow-card">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p
                  className="text-sm font-semibold text-ink"
                  style={{ fontFamily: '"Noto Serif", serif', fontStyle: 'italic', fontWeight: 600 }}
                >
                  Regras herdadas do Power BI
                </p>
                <p className="text-xs text-ink-2">
                  Alguns indicadores seguem regras históricas do modelo
                  anterior, mantidas de propósito para os números continuarem
                  comparáveis.
                </p>
              </div>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-pill bg-ink px-4 py-2 text-xs font-semibold text-cream transition-all hover:-translate-y-0.5 hover:bg-fmp no-underline"
            >
              Ver outros dashboards
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
