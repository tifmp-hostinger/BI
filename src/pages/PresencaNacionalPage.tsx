import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BookOpen,
  Compass,
  Filter,
  GraduationCap,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { BarraContexto } from '@/components/layout/BarraContexto';
import { KpiDestaque, KpiDestaqueSkeleton } from '@/components/ui/KpiDestaque';
import { StatCard, StatCardSkeleton, STAT_GRID_CONTAINER } from '@/components/ui/StatCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { ChartSkeleton } from '@/components/ui/Skeletons';
import { ErrorState } from '@/components/ui/ErrorState';
import { FONTES_POR_DASHBOARD, ritmoDoDataset } from '@/lib/dataFreshness';
import { EmptyState } from '@/components/ui/EmptyState';
import { BrazilStateMap } from '@/components/maps/BrazilStateMap';
import { StateDetailPanel } from '@/components/panels/StateDetailPanel';
import { useMatriculas } from '@/hooks/useMatriculas';
import { nameOf } from '@/lib/brStates';
import type { MatriculaSource } from '@/services/matriculasService';
import { CHART_TOOLTIP, CORES_CATEGORICAS } from '@/lib/chartColors';
import { fmtBRL, fmtBRLCompact, fmtInt, truncateLabel } from '@/lib/formatters';
import { BotaoInspecionar } from '@/components/ui/BotaoInspecionar';

const REGION_COLORS: Record<string, string> = {
  Sul: CORES_CATEGORICAS[0],
  Sudeste: CORES_CATEGORICAS[1],
  Nordeste: CORES_CATEGORICAS[2],
  'Centro-Oeste': CORES_CATEGORICAS[3],
  Norte: CORES_CATEGORICAS[4],
  Outros: '#BFBAA4',
};

const SOURCE_OPTIONS: Array<{
  value: MatriculaSource | 'all';
  label: string;
  icon: typeof Users;
}> = [
  { value: 'all', label: 'Tudo', icon: Sparkles },
  { value: 'pos', label: 'Pós-graduação', icon: GraduationCap },
  { value: 'cursoslivres', label: 'Cursos Livres', icon: BookOpen },
];

const REGION_OPTIONS = ['Todas', 'Sul', 'Sudeste', 'Nordeste', 'Centro-Oeste', 'Norte'];

export function PresencaNacionalPage() {
  const [source, setSource] = useState<MatriculaSource | 'all'>('all');
  const [region, setRegion] = useState<string>('');
  const [onlyMatriculados, setOnlyMatriculados] = useState(false);
  const [selectedUf, setSelectedUf] = useState<string | null>(null);

  const { raw, stats, detailFor, loading, revalidando, error, refetch } = useMatriculas({
    source,
    region: region || undefined,
    onlyMatriculados,
  });

  const tt = CHART_TOOLTIP;

  // A tela abre já contando uma história: o estado líder vem selecionado no
  // painel de detalhe (uma única vez — fechar ou trocar depois é respeitado).
  const painelJaAberto = useRef(false);
  useEffect(() => {
    if (loading || painelJaAberto.current) return;
    if (stats.byState.length > 0) {
      painelJaAberto.current = true;
      setSelectedUf((atual) => atual ?? stats.byState[0].uf);
    }
  }, [loading, stats.byState]);

  // No mobile o painel renderiza ABAIXO do mapa: sem isto, tocar numa bolha
  // parecia não fazer nada (o painel abria fora da viewport). useCallback:
  // identidade estável, para nunca invalidar efeitos do mapa.
  const painelRef = useRef<HTMLDivElement>(null);
  const selecionaUf = useCallback((uf: string | null) => {
    setSelectedUf(uf);
    if (uf && window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => {
        painelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);

  /**
   * Proxy de frescor por tabela, sobre `raw` (download completo, sem
   * filtro de usuário) — nunca dispara consulta nova. `raw` mistura as
   * duas fontes (Pós + Cursos Livres) num só array com `source`, então
   * separa por essa flag antes do max.
   */
  const freshnessRitmos = useMemo(
    () => ({
      stg_rm_matriculas_pos: ritmoDoDataset(
        raw.filter((m) => m.source === 'pos'),
        'data',
      ),
      stg_rm_matriculas_cursoslivres: ritmoDoDataset(
        raw.filter((m) => m.source === 'cursoslivres'),
        'data',
      ),
    }),
    [raw],
  );

  const detail = useMemo(
    () => (selectedUf ? detailFor(selectedUf) : null),
    [selectedUf, detailFor]
  );

  const topState = stats.byState[0];
  const topRegion = stats.byRegion[0];

  const conversion =
    stats.total > 0 ? Math.round((stats.matriculados / stats.total) * 100) : 0;

  return (
    <AppShell
      title="Presença Nacional"
      subtitle="Distribuição de matrículas por estado"
    >
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <BarraContexto
          descricao="Mapa das matrículas de Pós-graduação e Cursos Livres pelo Brasil, somando todo o histórico. Clique em um estado no mapa (ou numa barra do ranking) para ver cursos, cidades, situações e faturamento daquele estado."
          tabelas={FONTES_POR_DASHBOARD['presenca-nacional']}
          inspecao={
            <BotaoInspecionar
              rotulo="Explorar dados"
              titulo="Matrículas (linhas brutas)"
              arquivo="presenca-dados"
              linhas={(raw as unknown) as Record<string, unknown>[]}
            />
          }
          ritmos={freshnessRitmos}
          revalidando={revalidando}
          onAtualizar={refetch}
        />

        {/* Filters */}
        <section className="relative z-20 flex flex-wrap items-center gap-3 rounded-md border border-line bg-card p-4 shadow-card animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-2">
            <Filter className="h-4 w-4 text-fmp" />
            Fonte:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SOURCE_OPTIONS.map((opt) => {
              const active = source === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSource(opt.value)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-2xs font-semibold transition ${
                    active
                      ? 'bg-fmp text-white shadow-glow'
                      : 'bg-paper text-ink-2 hover:bg-sand/30'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="ml-2 hidden h-6 w-px bg-line sm:block" />

          <div className="flex flex-wrap items-center gap-2">
            {REGION_OPTIONS.map((r) => {
              const value = r === 'Todas' ? '' : r;
              const active = region === value;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(value)}
                  className={`rounded-md px-3 py-1.5 text-2xs font-semibold transition ${
                    active
                      ? 'bg-fmp text-white shadow-glow'
                      : 'bg-paper text-ink-2 hover:bg-sand/30'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>

          <label
            className="ml-auto inline-flex items-center gap-2 text-2xs font-semibold text-ink-2"
            title="Sem esta opção, o mapa inclui também matrículas canceladas, desistentes e concluídas."
          >
            <input
              type="checkbox"
              checked={onlyMatriculados}
              onChange={(e) => setOnlyMatriculados(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-line-2 text-fmp focus:ring-fmp"
            />
            Somente matriculados (situação ativa)
          </label>
        </section>

        {error && (
          <ErrorState
            title="Não foi possível carregar as matrículas"
            message={error}
            onRetry={refetch}
          />
        )}

        {/* KPI row */}
        {/* Destaque + apoio. Nenhum número novo: o volume total vira o
            indicador principal e as contagens de UFs e cidades — que antes
            eram chips do hero — passam a card, para não se perderem. */}
        <section className={STAT_GRID_CONTAINER}>
          <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @4xl:grid-cols-4">
            {loading && (
              <>
                <KpiDestaqueSkeleton className="@md:col-span-2 @4xl:row-span-2" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <StatCardSkeleton key={i} index={i} />
                ))}
              </>
            )}
            {!loading && (
              <>
                <KpiDestaque
                  className="@md:col-span-2 @4xl:row-span-2"
                  rotulo="Matrículas no Brasil"
                  valor={fmtInt(stats.total)}
                  hint="Todas as matrículas do recorte filtrado, em qualquer situação, somando todo o histórico."
                  icon={Users}
                  proporcao={stats.total > 0 ? stats.matriculados / stats.total : undefined}
                  proporcaoRotulo={`${conversion}% com matrícula ativa`}
                  apoio={
                    <>
                      <strong className="font-semibold text-ink">{fmtInt(stats.totalPos)}</strong> de
                      Pós-graduação e{' '}
                      <strong className="font-semibold text-ink">{fmtInt(stats.totalLivres)}</strong> de
                      Cursos Livres.
                    </>
                  }
                />
                <StatCard
                  index={0}
                  label="Estados alcançados"
                  value={fmtInt(stats.ufsCount)}
                  subtitle={`${fmtInt(stats.cidadesCount)} cidades`}
                  icon={MapPin}
                  color="fmp"
                />
                <StatCard
                  index={1}
                  label="UF líder"
                  value={topState ? topState.uf : '—'}
                  subtitle={
                    topState
                      ? `${nameOf(topState.uf)} — ${fmtInt(topState.total)} matrículas`
                      : ''
                  }
                  icon={MapPin}
                  color="gray"
                />
                <StatCard
                  index={2}
                  label="Faturamento total"
                  value={fmtBRLCompact(stats.faturado)}
                  exactValue={fmtBRL(stats.faturado)}
                  subtitle={`Ticket médio ${fmtBRLCompact(stats.ticketMedio)}`}
                  hint="Soma do valor faturado das matrículas do recorte. Ticket médio = faturamento ÷ matrículas com valor."
                  icon={Wallet}
                  color="fmp"
                />
                <StatCard
                  index={3}
                  label="Taxa de matriculados"
                  value={`${conversion}%`}
                  subtitle={`${fmtInt(stats.matriculados)} matrículas ativas`}
                  hint="Matrículas com situação ativa ÷ todas as matrículas do recorte (inclui canceladas e concluídas)."
                  icon={TrendingUp}
                  color="gray"
                />
              </>
            )}
          </div>
        </section>

        {/* Map + drill-down */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SectionCard
            className="lg:col-span-2"
            title="Mapa do Brasil"
            subtitle="Toque em um estado para explorar"
            icon={MapPin}
            actions={
              // Legenda do que o mapa REALMENTE codifica: gradiente areia →
              // vermelho por volume (a legenda antiga mostrava cores de
              // região que não existem em nenhuma bolha).
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-2xs text-ink-3">menos</span>
                <span
                  className="h-2 w-16 rounded-pill"
                  style={{ background: 'linear-gradient(to right, #BFBAA4, #EE2A42)' }}
                />
                <span className="text-2xs text-ink-3">mais matrículas</span>
              </div>
            }
          >
            {loading ? (
              <ChartSkeleton height={520} />
            ) : stats.byState.length === 0 ? (
              <EmptyState
                title="Sem matrículas para exibir"
                message="Ajuste os filtros ou tente novamente."
              />
            ) : (
              <>
                <BrazilStateMap
                  data={stats.byState}
                  selectedUf={selectedUf}
                  onSelect={selecionaUf}
                  height={520}
                />
                <p className="mt-2 text-2xs text-ink-3">
                  Tamanho e cor da bolha = volume de matrículas (escala
                  logarítmica: diferenças grandes aparecem comprimidas).
                </p>
              </>
            )}
          </SectionCard>

          <div ref={painelRef} className="scroll-mt-20 lg:col-span-1">
            <StateDetailPanel
              uf={selectedUf}
              detail={detail}
              totalNacional={stats.total}
              onClose={() => setSelectedUf(null)}
            />
          </div>
        </section>

        {/* Aggregated charts */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SectionCard
            className="lg:col-span-2"
            title="Top UFs por volume"
            subtitle="Ranking de matrículas por estado — clique numa barra para abrir o detalhe"
            icon={TrendingUp}
            actions={<BotaoInspecionar titulo="Matrículas por UF" arquivo="matriculas-por-uf" linhas={stats.byState} />}
          >
            {loading ? (
              <ChartSkeleton height={320} />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={stats.byState.slice(0, 12)}
                  margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="barUf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EE2A42" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#D32238" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="#2B2830"
                  />
                  <XAxis
                    dataKey="uf"
                    tick={{ fontSize: 11, fill: '#9B97A1' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9B97A1' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,77,99,0.10)' }}
                    contentStyle={tt.contentStyle}
                    labelStyle={tt.labelStyle}
                    itemStyle={tt.itemStyle}
                    formatter={(v: unknown) => [`${fmtInt(v as number)} matrículas`, 'Total']}
                    labelFormatter={(label: unknown) => {
                      const uf = String(label ?? '');
                      return `${nameOf(uf)} (${uf})`;
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="url(#barUf)"
                    radius={[8, 8, 4, 4]}
                    maxBarSize={24}
                    onClick={(d: unknown) => {
                      const row = d as { uf?: string };
                      if (row?.uf) selecionaUf(row.uf);
                    }}
                    cursor="pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard
            title="Distribuição por região"
            subtitle={topRegion ? `${topRegion.name} lidera` : 'Participacao regional'}
            icon={Compass}
            actions={<BotaoInspecionar titulo="Matrículas por Região" arquivo="matriculas-por-regiao" linhas={stats.byRegion} />}
          >
            {loading ? (
              <ChartSkeleton height={320} />
            ) : stats.byRegion.length === 0 ? (
              <EmptyState title="Sem dados" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Tooltip
                      contentStyle={tt.contentStyle}
                      itemStyle={tt.itemStyle}
                      formatter={(v: unknown) => [`${fmtInt(v as number)} matrículas`, '']}
                    />
                    <Pie
                      data={stats.byRegion}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {stats.byRegion.map((r) => (
                        <Cell
                          key={r.name}
                          fill={REGION_COLORS[r.name] ?? '#BFBAA4'}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-2 space-y-1.5">
                  {stats.byRegion.map((r) => {
                    const pct =
                      stats.total > 0
                        ? Math.round((r.value / stats.total) * 100)
                        : 0;
                    return (
                      <li
                        key={r.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="flex items-center gap-2 text-ink-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              background: REGION_COLORS[r.name] ?? '#BFBAA4',
                            }}
                          />
                          {r.name}
                        </span>
                        <span className="font-semibold text-ink">
                          {fmtInt(r.value)} <span className="text-ink-3">({pct}%)</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </SectionCard>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard
            title="Situações de matrícula"
            subtitle="Estágio no funil acadêmico"
          >
            {loading ? (
              <ChartSkeleton height={260} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={stats.bySituacao.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="barSitu" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#EE2A42" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#EE2A42" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    horizontal={false}
                    stroke="#2B2830"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9B97A1' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#D7D4CE' }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tickFormatter={(v: string) => truncateLabel(v, 14)}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,77,99,0.10)' }}
                    contentStyle={tt.contentStyle}
                    labelStyle={tt.labelStyle}
                    itemStyle={tt.itemStyle}
                    formatter={(v: unknown) => [`${fmtInt(v as number)} matrículas`, 'Total']}
                  />
                  <Bar
                    dataKey="value"
                    fill="url(#barSitu)"
                    radius={[4, 8, 8, 4]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard
            title="Modalidades e níveis"
            subtitle="Composição entre Pós-graduação e Cursos Livres"
          >
            {loading ? (
              <ChartSkeleton height={260} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={stats.byModalidade.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="barMod" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#EE2A42" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#B81E32" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    horizontal={false}
                    stroke="#2B2830"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9B97A1' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#D7D4CE' }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tickFormatter={(v: string) => truncateLabel(v, 14)}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,77,99,0.10)' }}
                    contentStyle={tt.contentStyle}
                    labelStyle={tt.labelStyle}
                    itemStyle={tt.itemStyle}
                    formatter={(v: unknown) => [`${fmtInt(v as number)} matrículas`, 'Total']}
                  />
                  <Bar
                    dataKey="value"
                    fill="url(#barMod)"
                    radius={[4, 8, 8, 4]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </section>

        <section className="rounded-md border border-dashed border-fmp/30 bg-fmp-muted p-5 animate-fade-in">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-sm bg-card p-2 text-fmp shadow-card">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p
                  className="text-sm font-semibold text-ink"
                  style={{ fontFamily: '"Noto Serif", serif', fontStyle: 'italic', fontWeight: 600 }}
                >
                  Novos indicadores em breve
                </p>
                <p className="text-xs text-ink-2">
                  Camada por CEP, filtros por curso e comparativo temporal serão
                  adicionados nas proximas evolucoes.
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
