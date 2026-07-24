import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  RefreshCw,
  Target,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorState } from '@/components/ui/ErrorState';
import { EspecializacoesBlock } from './components/EspecializacoesBlock';
import { GraduacaoBlock } from './components/GraduacaoBlock';
import { MestradoBlock } from './components/MestradoBlock';
import { useAnaliseConversaoData } from './hooks/useAnaliseConversaoData';

/** Meses padrao ate o mes atual (regra herdada do Power BI). */
function defaultMesesAte(anoAlvo: number, hoje = new Date()): number[] {
  const anoAtual = hoje.getFullYear();
  if (anoAlvo < anoAtual) return Array.from({ length: 12 }, (_, i) => i + 1);
  if (anoAlvo > anoAtual) return [];
  return Array.from({ length: hoje.getMonth() + 1 }, (_, i) => i + 1);
}

function pickDefaults(pletivos: { periodo: string }[]): {
  atual: string;
  anterior: string;
} {
  const validos = pletivos
    .map((p) => p.periodo)
    .filter((p) => /^\d{2}-\d{2}$/.test(p));
  const atual = validos[0] ?? '26-01';
  const anterior = validos[1] ?? '25-02';
  return { atual, anterior };
}

export function AnaliseConversaoPresidenciaPage() {
  const anoAtual = new Date().getFullYear();

  // Estado dos filtros: inicializamos apos o carregamento dos pletivos.
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
    graduacaoAtual,
    graduacaoAnterior,
    mestrado,
    especializacoes,
  } = useAnaliseConversaoData({
    periodoGradAtual,
    periodoGradAnterior,
    anoMestrado,
    anoPos,
    mesesPos,
  });

  // Ajusta os defaults assim que os pletivos chegam.
  if (base && !defaultsAplicados) {
    const { atual, anterior } = pickDefaults(base.pletivos);
    if (atual !== periodoGradAtual) setPeriodoGradAtual(atual);
    if (anterior !== periodoGradAnterior) setPeriodoGradAnterior(anterior);
    setDefaultsAplicados(true);
  }

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
      title="Analise de Conversao - Presidencia"
      subtitle="Funil comercial academico: leads, inscricoes, matriculas"
    >
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl hero-gradient p-6 text-white shadow-card sm:p-8 animate-fade-in">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-warning/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-fmp-light/25 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-2xs font-medium uppercase tracking-widest text-white/70 transition hover:text-white"
              >
                <ArrowLeft className="h-3 w-3" />
                Central de Dashboards
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-2xs font-medium uppercase tracking-widest text-white/85 ring-1 ring-inset ring-white/15">
                  <Target className="h-3 w-3" />
                  Presidencia
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-2xs font-medium text-white/85 ring-1 ring-inset ring-white/15">
                  <Award className="h-3 w-3" />
                  Somente leitura
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl">
                Analise de Conversao
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                Reproduz o funil comercial academico do Power BI com paridade
                total. Graduacao, Mestrado e Especializacoes em uma unica tela,
                sem expor dados pessoais.
              </p>
            </div>

            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-2xs font-medium text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/25"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
          </div>
        </section>

        {error && (
          <ErrorState
            title="Nao foi possivel carregar os dados"
            message={error}
            onRetry={refetch}
          />
        )}

        {rubeusFalha && (
          <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-light/60 p-4 text-warning-dark shadow-card">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Leads (Rubeus) indisponiveis</p>
              <p className="text-2xs">
                Os demais indicadores continuam sendo exibidos. {rubeusError}
              </p>
            </div>
          </div>
        )}

        {/* Blocos */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GraduacaoBlock
            title="Graduacao - Periodo Atual"
            subtitle="Vestibular vigente"
            kpis={graduacaoAtual}
            pletivos={base?.pletivos ?? []}
            periodo={periodoGradAtual}
            onPeriodoChange={setPeriodoGradAtual}
            accent="fmp"
            loading={loading || rubeusLoading}
          />
          <EspecializacoesBlock
            kpis={especializacoes}
            anos={anosPos}
            ano={anoPos}
            onAnoChange={setAnoPos}
            meses={mesesPos}
            onMesesChange={setMesesPos}
            loading={loading}
          />
          <GraduacaoBlock
            title="Graduacao - Periodo Anterior"
            subtitle="Comparativo historico"
            kpis={graduacaoAnterior}
            pletivos={base?.pletivos ?? []}
            periodo={periodoGradAnterior}
            onPeriodoChange={setPeriodoGradAnterior}
            accent="info"
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

        <section className="rounded-2xl border border-dashed border-fmp/30 bg-fmp-muted/40 p-5 animate-fade-in">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-2 text-fmp shadow-card">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-fmp-dark">
                  Regras herdadas do Power BI
                </p>
                <p className="text-xs text-gray-600">
                  Este dashboard preserva a logica original, incluindo
                  inconsistencias documentadas em
                  {' '}
                  <code className="rounded bg-white px-1.5 py-0.5 text-2xs text-fmp-dark">
                    docs/analise-conversao-presidencia-observacoes.md
                  </code>
                  .
                </p>
              </div>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-fmp-dark shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              Ver outros dashboards
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
