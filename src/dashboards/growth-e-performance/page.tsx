import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Chrome,
  DollarSign,
  Facebook,
  Filter,
  Map as MapIcon,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Percent,
  RefreshCw,
  Table as TableIcon,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard, StatCardSkeleton } from '@/components/ui/StatCard';
import { ChartSkeleton } from '@/components/ui/Skeletons';
import { ErrorState } from '@/components/ui/ErrorState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { fmtBRLCompact, fmtPct } from '../analise-de-conversao/formatters';
import { DATA_INICIO_DEFAULT, PRODUTOS, type Produto } from './constants';
import { useGrowthData } from './hooks/useGrowthData';
import { FunnelPanel } from './components/FunnelPanel';
import { CampanhasView, HorariosView, MapaView, SerieMensalView } from './components/GrowthViews';
import type { Fonte, GrowthFilters, GrowthView } from './types';

const VIEWS: { id: GrowthView; label: string; icon: typeof TableIcon }[] = [
  { id: 'campanhas', label: 'Campanhas', icon: TableIcon },
  { id: 'mapa', label: 'Mapa', icon: MapIcon },
  { id: 'horarios', label: 'Horários', icon: Clock },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'matriculas', label: 'Matrículas', icon: BarChart3 },
];

function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fonteFromToggles(google: boolean, meta: boolean): Fonte | null {
  if (google && meta) return 'Todos';
  if (google) return 'Google';
  if (meta) return 'Meta';
  return null;
}

function fmtOrDash(v: number | null, fmt: (n: number) => string): string {
  return v === null ? '--' : fmt(v);
}

export function GrowthEPerformancePage() {
  const [produto, setProduto] = useState<Produto>('Graduação');
  // BI original abre com o padrão em "Matrículas" (bookmark default).
  const [view, setView] = useState<GrowthView>('matriculas');
  const [googleOn, setGoogleOn] = useState(false);
  const [metaOn, setMetaOn] = useState(false);
  const [dataInicio, setDataInicio] = useState<string | null>(DATA_INICIO_DEFAULT);
  const [dataFim, setDataFim] = useState<string | null>(hojeISO);
  const [periodoLetivo, setPeriodoLetivo] = useState<string[]>([]);
  const [fimDeSemana, setFimDeSemana] = useState<'Fim de Semana' | 'Dia de Semana' | null>(null);
  const [painelAberto, setPainelAberto] = useState(true);

  const filters: GrowthFilters = useMemo(
    () => ({
      produto,
      fonte: fonteFromToggles(googleOn, metaOn),
      dataInicio,
      dataFim,
      periodoLetivo,
      fimDeSemana,
    }),
    [produto, googleOn, metaOn, dataInicio, dataFim, periodoLetivo, fimDeSemana],
  );

  const {
    loading, error, progress, atualizadoEm, pletivo,
    media, negocio, campanhas, mapa, horarios, serieLeads, serieMatriculas, refetch,
  } = useGrowthData(filters, view);

  const limparFiltros = () => {
    setGoogleOn(false);
    setMetaOn(false);
    setDataInicio(DATA_INICIO_DEFAULT);
    setDataFim(hojeISO());
    setPeriodoLetivo([]);
    setFimDeSemana(null);
  };

  return (
    <AppShell
      title="Growth e Performance"
      subtitle="Mídia paga (Google + Meta) cruzada com o funil de captação, por produto"
    >
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
        {/* Topo */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-2xs font-medium uppercase tracking-widest text-ink-3 transition hover:text-fmp no-underline"
            >
              <ArrowLeft className="h-3 w-3" />
              Central de Dashboards
            </Link>
            {atualizadoEm && (
              <span className="text-2xs text-ink-3">
                Atualizado em {atualizadoEm.toLocaleDateString('pt-BR')} às{' '}
                {atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-ink-3 sm:inline">Olá, Equipe FMP</span>
            {/* Seleção de Fonte: botões de plataforma (Google / Meta) */}
            <button
              type="button"
              aria-pressed={googleOn}
              onClick={() => setGoogleOn((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-2xs font-semibold transition ${
                googleOn ? 'bg-fmp text-white shadow-glow' : 'border border-line bg-white text-ink-2 hover:bg-paper'
              }`}
            >
              <Chrome className="h-3.5 w-3.5" />
              Google
            </button>
            <button
              type="button"
              aria-pressed={metaOn}
              onClick={() => setMetaOn((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-2xs font-semibold transition ${
                metaOn ? 'bg-fmp text-white shadow-glow' : 'border border-line bg-white text-ink-2 hover:bg-paper'
              }`}
            >
              <Facebook className="h-3.5 w-3.5" />
              Meta
            </button>
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-1.5 rounded-pill bg-fmp px-3 py-1.5 text-2xs font-medium text-white transition hover:bg-fmp-dark"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Painel de filtros (abre/fecha) */}
          <aside className={painelAberto ? 'w-56 flex-shrink-0' : 'w-10 flex-shrink-0'}>
            <div className="sticky top-4 rounded-md border border-line bg-white p-3 shadow-card">
              <div className="flex items-center justify-between">
                {painelAberto && (
                  <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-ink-3">
                    <Filter className="h-3 w-3" />
                    Filtros
                  </span>
                )}
                <button
                  type="button"
                  aria-label={painelAberto ? 'Recolher painel de filtros' : 'Expandir painel de filtros'}
                  onClick={() => setPainelAberto((v) => !v)}
                  className="rounded-sm p-1 text-ink-3 transition hover:bg-paper hover:text-ink"
                >
                  {painelAberto ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </button>
              </div>

              {painelAberto && (
                <div className="mt-3 space-y-4">
                  <nav aria-label="Produtos" className="space-y-1">
                    {PRODUTOS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={produto === p.label}
                        onClick={() => setProduto(p.label)}
                        className={`block w-full rounded-pill px-3 py-1.5 text-left text-xs font-semibold transition ${
                          produto === p.label ? 'bg-fmp text-white shadow-glow' : 'text-ink-2 hover:bg-paper'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </nav>

                  <div className="space-y-1.5 border-t border-line pt-3">
                    <label htmlFor="growth-data-ini" className="text-2xs font-semibold uppercase tracking-widest text-ink-3">
                      Data Início
                    </label>
                    <input
                      id="growth-data-ini"
                      type="date"
                      className="w-full rounded-sm border border-line bg-paper px-2 py-1.5 text-xs text-ink focus:border-fmp focus:outline-none"
                      value={dataInicio ?? ''}
                      onChange={(e) => setDataInicio(e.target.value || null)}
                    />
                    <label htmlFor="growth-data-fim" className="text-2xs font-semibold uppercase tracking-widest text-ink-3">
                      Data Fim
                    </label>
                    <input
                      id="growth-data-fim"
                      type="date"
                      className="w-full rounded-sm border border-line bg-paper px-2 py-1.5 text-xs text-ink focus:border-fmp focus:outline-none"
                      value={dataFim ?? ''}
                      onChange={(e) => setDataFim(e.target.value || null)}
                    />
                  </div>

                  {/* Período Letivo: oculto por padrão no BI original */}
                  <details className="border-t border-line pt-3">
                    <summary className="cursor-pointer text-2xs font-semibold uppercase tracking-widest text-ink-3">
                      Período Letivo
                    </summary>
                    <div className="relative z-20 mt-2">
                      <MultiSelect
                        label="Período"
                        options={pletivo.map((p) => p.periodo_letivo)}
                        selected={periodoLetivo}
                        onChange={(next) => setPeriodoLetivo(next.map(String))}
                        widthClass="w-full"
                      />
                    </div>
                  </details>

                  <div className="space-y-1.5 border-t border-line pt-3">
                    <label htmlFor="growth-fds" className="text-2xs font-semibold uppercase tracking-widest text-ink-3">
                      Fim de Semana
                    </label>
                    <select
                      id="growth-fds"
                      className="w-full rounded-sm border border-line bg-paper px-2 py-1.5 text-xs text-ink focus:border-fmp focus:outline-none"
                      value={fimDeSemana ?? ''}
                      onChange={(e) =>
                        setFimDeSemana(e.target.value ? (e.target.value as 'Fim de Semana' | 'Dia de Semana') : null)
                      }
                    >
                      <option value="">Todos</option>
                      <option value="Dia de Semana">Dia de Semana</option>
                      <option value="Fim de Semana">Fim de Semana</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="w-full rounded-pill bg-paper px-3 py-1.5 text-2xs font-semibold text-ink-2 transition hover:bg-line"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Conteúdo */}
          <div className="min-w-0 flex-1 space-y-4">
            {loading && progress && (
              <div className="rounded-md border border-line bg-white p-4 text-center text-xs text-ink-3 shadow-card animate-fade-in">
                {progress}
              </div>
            )}
            {error && <ErrorState title="Não foi possível carregar os dados" message={error} onRetry={refetch} />}

            <ErrorBoundary title="Não foi possível exibir este produto">
              {loading ? (
                <>
                  <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <StatCardSkeleton key={i} index={i} />
                    ))}
                  </section>
                  <ChartSkeleton height={360} />
                </>
              ) : media && negocio ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="min-w-0 space-y-4">
                    {/* Faixa de KPIs — 2 linhas de 4 */}
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard index={0} label="Investimento" value={fmtBRLCompact(media.investimento)} icon={DollarSign} color="fmp" highlight />
                      <StatCard index={1} label="Ticket Médio" value={fmtOrDash(negocio.ticketMedio, fmtBRLCompact)} icon={Wallet} color="fmp" />
                      <StatCard index={2} label="ROAS" value={fmtOrDash(negocio.roas, (n) => n.toFixed(2))} icon={TrendingUp} color="fmp" />
                      <StatCard index={3} label="CPL" value={fmtOrDash(media.cpl, fmtBRLCompact)} icon={Target} color="gray" />
                      <StatCard index={4} label="CAC" value={fmtOrDash(negocio.cac, fmtBRLCompact)} icon={Target} color="gray" />
                      <StatCard index={5} label="Faturamento" value={fmtBRLCompact(negocio.faturamento)} icon={DollarSign} color="fmp" />
                      <StatCard index={6} label="ROAS Mídia" value={fmtOrDash(negocio.roasMidia, (n) => n.toFixed(2))} icon={TrendingUp} color="gray" />
                      <StatCard index={7} label="Conversão" value={fmtOrDash(negocio.taxaConv, fmtPct)} icon={Percent} color="gray" />
                    </section>

                    {/* Faixa de visões */}
                    <div
                      role="tablist"
                      aria-label="Visões do dashboard"
                      className="flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-line bg-white p-1 shadow-card sm:w-fit"
                    >
                      {VIEWS.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          role="tab"
                          aria-selected={view === v.id}
                          onClick={() => setView(v.id)}
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-4 py-2 text-xs font-semibold transition ${
                            view === v.id ? 'bg-fmp text-white shadow-glow' : 'text-ink-2 hover:bg-paper'
                          }`}
                        >
                          <v.icon className="h-3.5 w-3.5" />
                          {v.label}
                        </button>
                      ))}
                    </div>

                    <ErrorBoundary title="Não foi possível exibir esta visão">
                      {view === 'campanhas' && (
                        <SectionCard title="Campanhas" subtitle="Campanha × Leads, Investimento e Impressões" icon={TableIcon}>
                          {campanhas ? <CampanhasView rows={campanhas} /> : <ChartSkeleton height={320} />}
                        </SectionCard>
                      )}
                      {view === 'mapa' && (
                        <SectionCard title="Mapa por UF" subtitle="Conversões e investimento — só Google" icon={MapIcon}>
                          {mapa ? <MapaView data={mapa} /> : <ChartSkeleton height={420} />}
                        </SectionCard>
                      )}
                      {view === 'horarios' && (
                        <SectionCard title="Leads por Horário" subtitle="Faixa de 2h × Leads + Taxa de Conversão (Rubeus)" icon={Clock}>
                          {horarios ? <HorariosView data={horarios} /> : <ChartSkeleton height={360} />}
                        </SectionCard>
                      )}
                      {view === 'leads' && (
                        <SectionCard title="Leads por Mês" subtitle="Mês Ano × Leads + Investimento" icon={Calendar}>
                          {serieLeads ? <SerieMensalView data={serieLeads} label="Leads" /> : <ChartSkeleton height={360} />}
                        </SectionCard>
                      )}
                      {view === 'matriculas' && (
                        <SectionCard title="Matrículas por Mês" subtitle="Mês Ano × Matrículas + Investimento" icon={Calendar}>
                          {serieMatriculas ? <SerieMensalView data={serieMatriculas} label="Matrículas" /> : <ChartSkeleton height={360} />}
                        </SectionCard>
                      )}
                    </ErrorBoundary>
                  </div>

                  {/* Painel direito — funil */}
                  <FunnelPanel media={media} negocio={negocio} />
                </div>
              ) : null}
            </ErrorBoundary>

            <footer className="pt-2 text-center text-2xs text-ink-3">
              Desenvolvido por Assessoria de Business Intelligence | Julho/2026
            </footer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
