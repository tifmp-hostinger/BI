import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Chrome,
  DollarSign,
  Facebook,
  Filter,
  HelpCircle,
  Map as MapIcon,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Percent,
  RefreshCw,
  Share2,
  Table as TableIcon,
  Target,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard, StatCardSkeleton, STAT_GRID_CONTAINER } from '@/components/ui/StatCard';
import { KpiDestaque, KpiDestaqueSkeleton } from '@/components/ui/KpiDestaque';
import { BalaoInfo } from '@/components/ui/BalaoInfo';
import { ChartSkeleton, LoadingSteps } from '@/components/ui/Skeletons';
import { ErrorState } from '@/components/ui/ErrorState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { DataFreshness } from '@/components/ui/DataFreshness';
import { AtualizandoAviso } from '@/components/ui/AtualizandoAviso';
import { SeletorVisualizacao } from '@/components/ui/SeletorVisualizacao';
import { FONTES_POR_DASHBOARD } from '@/lib/dataFreshness';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { fmtBRLCompact, fmtInt, fmtPct, fmtRatio } from '@/lib/formatters';
import { DATA_INICIO_DEFAULT, PRODUTOS, type Produto } from './constants';
import { useGrowthData } from './hooks/useGrowthData';
import { FunnelPanel } from './components/FunnelPanel';
import {
  CampanhasView,
  HorariosView,
  MapaView,
  OrigemView,
  SerieMensalView,
} from './components/GrowthViews';
import type { Fonte, GrowthFilters, GrowthView } from './types';

/**
 * Grade da faixa de KPIs deste painel — não usa STAT_GRID_CLASSES porque
 * aqui existe um card-herói e a grade precisa fechar sem sobras.
 *
 * A coluna de conteúdo do Growth é a mais estreita do app (divide espaço com
 * o painel de filtros e, a partir de xl, com o funil de 300px), por isso um
 * degrau intermediário de 3 colunas: em 5 colunas o herói ocupa 2×2 e os
 * seis cards de apoio fecham 3×2; em 3 colunas o herói ocupa a linha inteira
 * e os seis caem em 3+3; em 2 colunas, 3 linhas de 2. Nenhuma sobra.
 */
const GRADE_KPI = 'grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-5';
const HERO_SPAN = '@sm:col-span-2 @2xl:col-span-3 @4xl:col-span-2 @4xl:row-span-2';

type TabId = 'campanhas' | 'mapa' | 'horarios' | 'series' | 'origem';

const VIEWS: { id: TabId; label: string; icon: typeof TableIcon }[] = [
  { id: 'campanhas', label: 'Campanhas', icon: TableIcon },
  { id: 'mapa', label: 'Mapa', icon: MapIcon },
  { id: 'horarios', label: 'Horários', icon: Clock },
  // Leads e Matrículas eram duas abas com o MESMO gráfico (só a série
  // vermelha mudava) — viraram uma aba com alternância interna.
  { id: 'series', label: 'Séries mensais', icon: BarChart3 },
  { id: 'origem', label: 'Origem', icon: Share2 },
];

/** Aba correspondente a cada visão de dados. */
function tabDoView(v: GrowthView): TabId {
  return v === 'leads' || v === 'matriculas' ? 'series' : v;
}

/**
 * Cursos Livres não tem mapa: o Google Ads nunca teve campanha dessa
 * modalidade (R$ 0,00 em todo o histórico) e o mapa só usa Google. O PBI
 * original também removeu o esriVisual dessa página — é a única das 5 sem
 * mapa. Paridade exata com o BI.
 */
function viewsDoProduto(produto: Produto) {
  return produto === 'Cursos Livres' ? VIEWS.filter((v) => v.id !== 'mapa') : VIEWS;
}

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

/** Valor por extenso para o tooltip dos cards, que exibem número abreviado. */
function exatoBRL(v: number | null): string | undefined {
  if (v === null) return undefined;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function exatoNum(v: number | null, casas = 2): string | undefined {
  if (v === null) return undefined;
  return v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** Explicações das métricas — termos técnicos que não são óbvios na tela. */
const HINTS = {
  investimento: 'Total gasto em mídia paga no período, somando as plataformas selecionadas.',
  ticketMedio: 'Faturamento dividido pelo número de matrículas.',
  roas: 'Retorno sobre o investimento: faturamento dividido pelo investimento em mídia. 2,50 = R$ 2,50 de receita para cada R$ 1 investido.',
  cpl: 'Custo por lead: investimento dividido pelo número de leads.',
  cac: 'Custo de aquisição por cliente: investimento dividido pelo número de matrículas.',
  faturamento: 'Receita das matrículas do período, pelas regras herdadas do Power BI.',
  roasMidia: 'ROAS restrito a quem teve origem no período (data de inscrição ou de contrato), não só baixa no período.',
  conversao: 'Matrículas divididas por leads no período.',
} as const;

export function GrowthEPerformancePage() {
  // Última seleção persiste entre visitas: quem acompanha Pós EAD não
  // precisa refazer o caminho a cada abertura (Graduação/Matrículas segue
  // sendo o padrão da primeira visita, como no BI).
  const [produto, setProduto] = useState<Produto>(() => {
    try {
      const salvo = localStorage.getItem('fmp-growth-produto');
      return PRODUTOS.some((p) => p.label === salvo) ? (salvo as Produto) : 'Graduação';
    } catch {
      return 'Graduação';
    }
  });
  const [view, setView] = useState<GrowthView>(() => {
    try {
      const salvo = localStorage.getItem('fmp-growth-view');
      const validas: GrowthView[] = ['campanhas', 'mapa', 'horarios', 'leads', 'matriculas', 'origem'];
      return validas.includes(salvo as GrowthView) ? (salvo as GrowthView) : 'matriculas';
    } catch {
      return 'matriculas';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('fmp-growth-produto', produto);
      localStorage.setItem('fmp-growth-view', view);
    } catch {
      // localStorage indisponível: preferência vale só nesta sessão.
    }
  }, [produto, view]);
  const [googleOn, setGoogleOn] = useState(false);
  const [metaOn, setMetaOn] = useState(false);
  const [dataInicio, setDataInicio] = useState<string | null>(DATA_INICIO_DEFAULT);
  const [dataFim, setDataFim] = useState<string | null>(hojeISO);
  const [periodoLetivo, setPeriodoLetivo] = useState<string[]>([]);
  const [fimDeSemana, setFimDeSemana] = useState<'Fim de Semana' | 'Dia de Semana' | null>(null);
  /**
   * Em telas estreitas o painel de filtros deixa de ser coluna lateral e vira
   * um bloco de largura inteira ACIMA do conteúdo. Aberto por padrão, ele
   * ocupava sozinho a primeira tela no celular: o primeiro número só aparecia
   * por volta dos 800px, muito abaixo da dobra. Recolhido, é uma barra de uma
   * linha que ainda mostra o produto selecionado e abre com um toque.
   * A partir de lg (coluna lateral de verdade), continua aberto.
   */
  const [painelAberto, setPainelAberto] = useState(
    () => typeof window === 'undefined' || window.matchMedia('(min-width: 1024px)').matches,
  );

  const viewsVisiveis = viewsDoProduto(produto);
  // Se a aba ativa não existe no produto atual (Mapa em Cursos Livres),
  // cai no padrão Matrículas em vez de mostrar uma visão vazia.
  const tabAtiva: TabId = viewsVisiveis.some((v) => v.id === tabDoView(view))
    ? tabDoView(view)
    : 'series';
  const viewAtiva: GrowthView = tabAtiva === 'series'
    ? (view === 'leads' ? 'leads' : 'matriculas')
    : (view as GrowthView);

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
    loading, revalidando, error, progress, pletivo,
    media, negocio, campanhas, mapa, horarios, origem, serieLeads, serieMatriculas,
    freshnessRitmos, refetch,
  } = useGrowthData(filters, viewAtiva);

  /**
   * Chips do que está filtrado agora, cada um removível. Antes o usuário
   * precisava abrir o painel lateral para descobrir por que os números
   * mudaram — principalmente com o painel recolhido.
   */
  const chipsAtivos: { label: string; remover: () => void }[] = [];
  if (googleOn) chipsAtivos.push({ label: 'Fonte: Google', remover: () => setGoogleOn(false) });
  if (metaOn) chipsAtivos.push({ label: 'Fonte: Meta', remover: () => setMetaOn(false) });
  if (dataInicio && dataInicio !== DATA_INICIO_DEFAULT) {
    chipsAtivos.push({
      label: `A partir de ${dataInicio.split('-').reverse().join('/')}`,
      remover: () => setDataInicio(DATA_INICIO_DEFAULT),
    });
  }
  if (dataFim && dataFim !== hojeISO()) {
    chipsAtivos.push({
      label: `Até ${dataFim.split('-').reverse().join('/')}`,
      remover: () => setDataFim(hojeISO()),
    });
  }
  for (const p of periodoLetivo) {
    chipsAtivos.push({
      label: `Período ${p}`,
      remover: () => setPeriodoLetivo((atual) => atual.filter((x) => x !== p)),
    });
  }
  if (fimDeSemana) {
    chipsAtivos.push({ label: fimDeSemana, remover: () => setFimDeSemana(null) });
  }

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
            <DataFreshness tabelas={FONTES_POR_DASHBOARD['growth-e-performance']} ritmos={freshnessRitmos} />
            <AtualizandoAviso visivel={revalidando} />
            {/* Mesmo "?" de contexto que os outros painéis ganharam na
                BarraContexto — aqui embutido na barra própria do Growth,
                que já carrega os botões de fonte. */}
            <BalaoInfo
              rotuloAcao="O que este painel mostra"
              gatilho={<HelpCircle className="h-3.5 w-3.5" strokeWidth={2.2} />}
            >
              <span className="block text-2xs leading-relaxed text-ink-2">
                Quanto foi investido em mídia paga (Google e Meta) e o que esse
                investimento devolveu em leads, matrículas e faturamento, por
                produto. Período Letivo e Fim de Semana filtram apenas os leads
                do CRM — o investimento não é filtrado por eles.
              </span>
            </BalaoInfo>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-ink-3 sm:inline">Olá, Equipe FMP</span>
            {/* Seleção de Fonte: botões de plataforma (Google / Meta).
                O rótulo mostra o estado atual — sem ele, "nenhum botão ligado"
                parecia "nada selecionado" quando na verdade soma as duas. */}
            <span className="hidden items-center gap-1 text-2xs font-semibold uppercase tracking-widest text-ink-3 sm:inline-flex">
              Fonte:
              <span className="text-ink-2">{fonteFromToggles(googleOn, metaOn) ?? 'Todas'}</span>
            </span>
            <button
              type="button"
              aria-pressed={googleOn}
              title={googleOn ? 'Remover filtro do Google' : 'Ver somente Google'}
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
              title={metaOn ? 'Remover filtro do Meta' : 'Ver somente Meta'}
              onClick={() => setMetaOn((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-2xs font-semibold transition ${
                metaOn ? 'bg-fmp text-white shadow-glow' : 'border border-line bg-white text-ink-2 hover:bg-paper'
              }`}
            >
              <Facebook className="h-3.5 w-3.5" />
              Meta
            </button>
            <SeletorVisualizacao />
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-1.5 rounded-pill bg-fmp px-3 py-1.5 text-2xs font-medium text-white transition hover:bg-fmp-dark"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${revalidando ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* No mobile o painel vira um bloco acima do conteúdo; a partir de lg
            volta a ser coluna lateral fixa. Antes ele disputava largura com os
            gráficos em telas estreitas. */}
        <div className="flex flex-col gap-4 lg:flex-row">
          <aside
            className={`flex-shrink-0 ${painelAberto ? 'w-full lg:w-56' : 'w-full lg:w-10'}`}
          >
            <div className="rounded-md border border-line bg-white p-3 shadow-card lg:sticky lg:top-4">
              <div className="flex items-center justify-between">
                {painelAberto ? (
                  <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-ink-3">
                    <Filter className="h-3 w-3" />
                    Filtros
                  </span>
                ) : (
                  // Recolhido no celular: sem isso a barra não dizia qual
                  // produto está selecionado — e produto é a navegação
                  // principal deste painel. Em lg a coluna tem 40px, não cabe.
                  <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-ink-3 lg:hidden">
                    <Filter className="h-3 w-3" />
                    Filtros · {produto}
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
                    {/* Atalhos: o período padrão (desde out/2025) cresce sem
                        limite a cada dia e mistura ciclos de captação — os
                        recortes recentes ficam a um clique. */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {([
                        { label: '30 dias', dias: 30 },
                        { label: '90 dias', dias: 90 },
                        { label: 'Tudo', dias: null },
                      ] as const).map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            if (p.dias === null) {
                              setDataInicio(DATA_INICIO_DEFAULT);
                            } else {
                              const d = new Date();
                              d.setDate(d.getDate() - p.dias);
                              setDataInicio(
                                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
                              );
                            }
                            setDataFim(hojeISO());
                          }}
                          className="rounded-pill bg-paper px-2 py-1 text-2xs font-semibold text-ink-2 transition hover:bg-line"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
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
            {loading && progress && <LoadingSteps mensagem={progress} />}
            {error && <ErrorState title="Não foi possível carregar os dados" message={error} onRetry={refetch} />}

            {/* key: sem ela o boundary guarda o estado de erro e trocar de
                produto/visão continuaria mostrando o cartão de falha até
                clicar em "Tentar novamente". A key remonta o boundary. */}
            <ErrorBoundary key={produto} title="Não foi possível exibir este produto">
              {loading ? (
                <>
                  <section className={STAT_GRID_CONTAINER}>
                    <div className={GRADE_KPI}>
                      <KpiDestaqueSkeleton className={HERO_SPAN} />
                      {Array.from({ length: 6 }).map((_, i) => (
                        <StatCardSkeleton key={i} index={i} />
                      ))}
                    </div>
                  </section>
                  <ChartSkeleton height={360} />
                </>
              ) : media && negocio ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="min-w-0 space-y-4">
                    {/*
                      Fiel ao BI: Período Letivo e Fim de Semana filtram só a
                      tabela do Rubeus (CRM) — o filtro não se propaga para
                      API Meta / API Google pelos relacionamentos. O cálculo
                      está certo; o aviso existe porque a leitura engana.
                    */}
                    {chipsAtivos.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 animate-fade-in">
                        <span className="text-2xs font-semibold uppercase tracking-widest text-ink-3">
                          Filtros ativos
                        </span>
                        {chipsAtivos.map((c) => (
                          <span
                            key={c.label}
                            className="inline-flex items-center gap-1 rounded-pill bg-fmp-muted px-2.5 py-1 text-2xs font-semibold text-fmp"
                          >
                            {c.label}
                            <button
                              type="button"
                              aria-label={`Remover filtro ${c.label}`}
                              title="Remover este filtro"
                              onClick={c.remover}
                              className="ml-0.5 rounded-full p-0.5 transition hover:bg-fmp/20"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={limparFiltros}
                          className="rounded-pill bg-paper px-2.5 py-1 text-2xs font-semibold text-ink-3 transition hover:bg-line"
                        >
                          Limpar tudo
                        </button>
                      </div>
                    )}

                    {(periodoLetivo.length > 0 || fimDeSemana) && (
                      <div className="rounded-md border border-line bg-paper px-4 py-2.5 text-2xs text-ink-2 animate-fade-in">
                        <strong className="font-semibold">Atenção:</strong> Período Letivo e Fim de Semana
                        filtram apenas os leads do CRM; o investimento em mídia não é filtrado — CPL, CAC,
                        ROAS e Conversão ficam distorcidos.
                      </div>
                    )}

                    {/* Faixa de KPIs — colunas reagem ao espaço REAL do
                        container (@container), não à viewport: esta coluna
                        divide espaço com o painel de filtros (224px) e, a
                        partir de xl, com o painel do funil (300px) — uma
                        media query de viewport não sabe disso, um container
                        query mede o espaço disponível de verdade. Também
                        reage ao colapsar/expandir o menu lateral, que muda a
                        largura do container sem mudar a viewport. */}
                    <section className={STAT_GRID_CONTAINER}>
                      <div className={GRADE_KPI}>
                        {/* Investimento promovido a card-herói: é o número que
                            responde à pergunta da tela ("quanto colocamos e o
                            que voltou") e era o único com `highlight`, uma
                            distinção fraca demais no meio de oito cards
                            iguais. O retorno vem na linha de leitura — todos
                            números que já estavam nesta mesma faixa. */}
                        <KpiDestaque
                          className={HERO_SPAN}
                          rotulo="Investimento em mídia paga"
                          valor={fmtBRLCompact(media.investimento)}
                          exato={exatoBRL(media.investimento)}
                          hint={HINTS.investimento}
                          icon={DollarSign}
                          apoio={
                            <>
                              <span className="block">
                                Retornou{' '}
                                <strong className="font-semibold text-ink">
                                  {fmtBRLCompact(negocio.faturamento)}
                                </strong>{' '}
                                em faturamento
                                {negocio.roas !== null && (
                                  <> — {fmtRatio(negocio.roas)} para cada R$ 1 investido</>
                                )}
                                .
                              </span>
                              <span className="mt-1 block text-ink-3">
                                {fmtInt(media.leads)} leads · {fmtInt(negocio.matriculas)} matrículas no período
                              </span>
                            </>
                          }
                        />
                        <StatCard index={1} label="Ticket Médio" value={fmtOrDash(negocio.ticketMedio, fmtBRLCompact)} exactValue={exatoBRL(negocio.ticketMedio)} hint={HINTS.ticketMedio} icon={Wallet} color="fmp" />
                        {/* ROAS e "ROAS Mídia" eram dois cards quase iguais
                            sem distinção visível — viraram um card com o
                            secundário no subtítulo. "2,50x" em pt-BR no lugar
                            de "2.50" com ponto. */}
                        <StatCard
                          index={2}
                          label="ROAS"
                          value={fmtOrDash(negocio.roas, fmtRatio)}
                          exactValue={exatoNum(negocio.roas)}
                          subtitle={negocio.roasMidia !== null ? `Por origem no período: ${fmtRatio(negocio.roasMidia)}` : undefined}
                          hint={`${HINTS.roas} A variação "por origem": ${HINTS.roasMidia}`}
                          icon={TrendingUp}
                          color="fmp"
                        />
                        <StatCard index={3} label="CPL" value={fmtOrDash(media.cpl, fmtBRLCompact)} exactValue={exatoBRL(media.cpl)} hint={HINTS.cpl} icon={Target} color="gray" />
                        <StatCard index={4} label="CAC" value={fmtOrDash(negocio.cac, fmtBRLCompact)} exactValue={exatoBRL(negocio.cac)} hint={HINTS.cac} icon={Target} color="gray" />
                        <StatCard index={5} label="Faturamento" value={fmtBRLCompact(negocio.faturamento)} exactValue={exatoBRL(negocio.faturamento)} hint={HINTS.faturamento} icon={DollarSign} color="fmp" />
                        <StatCard
                          index={6}
                          label="Conversão"
                          value={fmtOrDash(negocio.taxaConv, fmtPct)}
                          subtitle={`${fmtInt(negocio.matriculas)} matrículas ÷ ${fmtInt(media.leads)} leads`}
                          hint={HINTS.conversao}
                          icon={Percent}
                          color="gray"
                        />
                      </div>
                    </section>

                    {/* Faixa de visões */}
                    <div
                      role="tablist"
                      aria-label="Visões do dashboard"
                      className="flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-line bg-white p-1 shadow-card sm:w-fit"
                    >
                      {viewsVisiveis.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          role="tab"
                          aria-selected={tabAtiva === v.id}
                          onClick={() => setView(v.id === 'series' ? 'matriculas' : v.id)}
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-4 py-2 text-xs font-semibold transition ${
                            tabAtiva === v.id ? 'bg-fmp text-white shadow-glow' : 'text-ink-2 hover:bg-paper'
                          }`}
                        >
                          <v.icon className="h-3.5 w-3.5" />
                          {v.label}
                        </button>
                      ))}
                    </div>

                    <ErrorBoundary key={viewAtiva} title="Não foi possível exibir esta visão">
                      {viewAtiva === 'campanhas' && (
                        <SectionCard title="Campanhas" subtitle="Campanha × Leads, Investimento e Impressões" icon={TableIcon}>
                          {campanhas ? <CampanhasView rows={campanhas} /> : <ChartSkeleton height={320} />}
                        </SectionCard>
                      )}
                      {viewAtiva === 'mapa' && (
                        <SectionCard title="Mapa por UF" subtitle="Investimento por UF — só Google Ads" icon={MapIcon}>
                          {mapa ? <MapaView data={mapa} /> : <ChartSkeleton height={420} />}
                        </SectionCard>
                      )}
                      {viewAtiva === 'horarios' && (
                        <SectionCard title="Leads por Horário" subtitle="Faixa de 2h × Leads + Taxa de Conversão (Rubeus)" icon={Clock}>
                          {horarios ? <HorariosView data={horarios} /> : <ChartSkeleton height={360} />}
                        </SectionCard>
                      )}

                      {viewAtiva === 'origem' && (
                        <SectionCard
                          title="Origem das matrículas"
                          subtitle="Primeiro toque por pessoa — visão nova, sem equivalente no Power BI"
                          icon={Share2}
                        >
                          {origem ? <OrigemView data={origem} /> : <ChartSkeleton height={360} />}
                        </SectionCard>
                      )}
                      {tabAtiva === 'series' && (
                        <SectionCard
                          title={viewAtiva === 'leads' ? 'Leads por Mês' : 'Matrículas por Mês'}
                          subtitle="Linha vermelha: volume mensal | Linha bege: investimento — segue o filtro de datas"
                          icon={Calendar}
                          actions={
                            <div className="flex items-center gap-1 rounded-pill border border-line bg-paper p-0.5">
                              {(['matriculas', 'leads'] as const).map((opcao) => (
                                <button
                                  key={opcao}
                                  type="button"
                                  aria-pressed={viewAtiva === opcao}
                                  onClick={() => setView(opcao)}
                                  className={`rounded-pill px-2.5 py-1 text-2xs font-semibold transition ${
                                    viewAtiva === opcao ? 'bg-fmp text-white' : 'text-ink-2 hover:bg-white'
                                  }`}
                                >
                                  {opcao === 'matriculas' ? 'Matrículas' : 'Leads'}
                                </button>
                              ))}
                            </div>
                          }
                        >
                          {viewAtiva === 'leads' ? (
                            serieLeads ? <SerieMensalView data={serieLeads} label="Leads" /> : <ChartSkeleton height={360} />
                          ) : (
                            serieMatriculas ? <SerieMensalView data={serieMatriculas} label="Matrículas" /> : <ChartSkeleton height={360} />
                          )}
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
              Desenvolvido por Assessoria de Business Intelligence
            </footer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
