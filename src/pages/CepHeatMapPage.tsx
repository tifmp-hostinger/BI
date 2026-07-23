import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  BarChart3,
  Filter,
  MapPin,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard, StatCardSkeleton } from '@/components/ui/StatCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { Badge } from '@/components/ui/Badge';
import { ChartSkeleton } from '@/components/ui/Skeletons';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { CepHeatMap } from '@/components/maps/CepHeatMap';
import { useCepData } from '@/hooks/useCepData';

const REGION_COLORS = ['#2E5AAC', '#0EA5E9', '#16A34A', '#D97706', '#DC2626'];

const REGIONS = [
  'Todas',
  'Sudeste',
  'Sul',
  'Nordeste',
  'Centro-Oeste',
  'Norte',
];
const STATUSES: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos os perfis' },
  { value: 'active', label: 'Ativos' },
  { value: 'prospect', label: 'Prospectos' },
  { value: 'alumni', label: 'Egressos' },
];

function chartTooltipStyle() {
  return {
    contentStyle: {
      background: 'rgba(255,255,255,0.98)',
      border: '1px solid rgba(226,232,240,0.9)',
      borderRadius: 12,
      boxShadow: '0 12px 24px -12px rgba(15,23,42,0.25)',
      padding: 10,
      fontSize: 12,
    } as const,
    labelStyle: {
      color: '#0f172a',
      fontWeight: 600,
      marginBottom: 4,
      fontSize: 12,
    } as const,
    itemStyle: { color: '#475569', fontSize: 12 } as const,
  };
}

export function CepHeatMapPage() {
  const [region, setRegion] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const { data, stats, loading, error, refetch } = useCepData({
    region: region || undefined,
    status: status || undefined,
  });

  const tt = useMemo(chartTooltipStyle, []);
  const topRegion = stats.byRegion[0];
  const topState = stats.byState[0];
  const conversion =
    stats.total > 0 ? Math.round((stats.activeUsers / stats.total) * 100) : 0;

  return (
    <AppShell
      title="Mapa de Calor por CEP"
      subtitle="Distribuicao geografica e indicadores demograficos"
    >
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <section className="relative overflow-hidden rounded-3xl hero-gradient p-6 text-white shadow-card sm:p-8 animate-fade-in">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-info/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-fmp-light/25 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-2xs font-medium uppercase tracking-widest text-white/70 hover:text-white"
              >
                <ArrowLeft className="h-3 w-3" />
                Central de Dashboards
              </Link>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-2xs font-medium uppercase tracking-widest text-white/80 ring-1 ring-inset ring-white/15">
                  <Sparkles className="h-3 w-3" />
                  Geolocalizacao
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-2xs font-medium text-white/80 ring-1 ring-inset ring-white/15">
                  <MapPin className="h-3 w-3" />
                  {stats.cityCount} cidades
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">
                Onde estao os usuarios da FMP
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/70">
                Concentracao de CEPs no Brasil, com cruzamento por perfil,
                faixa etaria e curso. Novos indicadores podem ser adicionados a
                qualquer momento.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-inset ring-white/15 backdrop-blur">
                <p className="text-2xs uppercase tracking-widest text-white/60">
                  Registros
                </p>
                <p className="mt-1 text-xl font-semibold">{stats.total}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-inset ring-white/15 backdrop-blur">
                <p className="text-2xs uppercase tracking-widest text-white/60">
                  UFs cobertas
                </p>
                <p className="mt-1 text-xl font-semibold">{stats.stateCount}</p>
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
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-card animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <Filter className="h-4 w-4 text-fmp" />
            Filtros:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {REGIONS.map((r) => {
              const value = r === 'Todas' ? '' : r;
              const active = region === value;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(value)}
                  className={`rounded-full px-3 py-1.5 text-2xs font-semibold transition ${
                    active
                      ? 'bg-fmp text-white shadow-glow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-2xs font-semibold uppercase tracking-widest text-gray-500">
              Perfil
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-full glass-input px-3 py-1.5 text-xs font-medium text-gray-700"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} index={i} />
            ))}
          {!loading && (
            <>
              <StatCard
                index={0}
                label="Total de CEPs"
                value={stats.total.toLocaleString('pt-BR')}
                subtitle="Registros ativos na base"
                icon={Users}
                color="fmp"
                highlight
                trend={{ value: 8.4, direction: 'up' }}
              />
              <StatCard
                index={1}
                label="Regiao lider"
                value={topRegion?.name ?? '—'}
                subtitle={
                  topRegion ? `${topRegion.value} usuarios concentrados` : ''
                }
                icon={MapPin}
                color="info"
                trend={{ value: 3.1, direction: 'up' }}
              />
              <StatCard
                index={2}
                label="UF mais representada"
                value={topState?.name ?? '—'}
                subtitle={
                  topState ? `${topState.value} usuarios nessa UF` : ''
                }
                icon={BarChart3}
                color="warning"
                trend={{ value: 1.6, direction: 'flat' }}
              />
              <StatCard
                index={3}
                label="Conversao ativa"
                value={`${conversion}%`}
                subtitle={`${stats.activeUsers} usuarios ativos`}
                icon={TrendingUp}
                color="success"
                trend={{ value: 2.2, direction: 'up' }}
              />
            </>
          )}
        </section>

        {error && (
          <ErrorState
            title="Nao foi possivel carregar os dados"
            message={error}
            onRetry={refetch}
          />
        )}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SectionCard
            className="lg:col-span-2"
            title="Mapa de calor por CEP"
            subtitle="Concentracao de usuarios pelo territorio brasileiro"
            icon={MapPin}
            actions={
              <div className="hidden items-center gap-1 sm:flex">
                <span className="h-2 w-2 rounded-full bg-[#4A78D1]" />
                <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                <span className="h-2 w-2 rounded-full bg-[#D97706]" />
                <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
                <span className="ml-2 text-2xs text-gray-500">
                  baixa &rarr; alta
                </span>
              </div>
            }
          >
            {loading ? (
              <ChartSkeleton height={480} />
            ) : data.length === 0 ? (
              <EmptyState
                title="Sem CEPs para exibir"
                message="Ajuste os filtros ou aguarde novos dados chegarem na base."
              />
            ) : (
              <CepHeatMap points={data} height={480} />
            )}
          </SectionCard>

          <SectionCard
            title="Distribuicao por regiao"
            subtitle="Participacao percentual"
            icon={BarChart3}
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
                      formatter={(v: unknown) => [`${v} usuarios`, '']}
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
                      {stats.byRegion.map((_, i) => (
                        <Cell
                          key={i}
                          fill={REGION_COLORS[i % REGION_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-2 space-y-1.5">
                  {stats.byRegion.map((r, i) => {
                    const pct =
                      stats.total > 0
                        ? Math.round((r.value / stats.total) * 100)
                        : 0;
                    return (
                      <li
                        key={r.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="flex items-center gap-2 text-gray-600">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              background:
                                REGION_COLORS[i % REGION_COLORS.length],
                            }}
                          />
                          {r.name}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {pct}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </SectionCard>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SectionCard
            className="lg:col-span-2"
            title="Top 10 UFs por volume"
            subtitle="Estados com maior concentracao de usuarios"
            icon={BarChart3}
          >
            {loading ? (
              <ChartSkeleton height={280} />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={stats.byState}
                  margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4A78D1" stopOpacity={0.95} />
                      <stop
                        offset="100%"
                        stopColor="#2E5AAC"
                        stopOpacity={0.85}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#E2E8F0"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(46,90,172,0.05)' }}
                    contentStyle={tt.contentStyle}
                    labelStyle={tt.labelStyle}
                    itemStyle={tt.itemStyle}
                    formatter={(v: unknown) => [`${v} usuarios`, 'Total']}
                  />
                  <Bar
                    dataKey="value"
                    fill="url(#barBlue)"
                    radius={[8, 8, 4, 4]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard
            title="Faixa etaria"
            subtitle="Perfil demografico dos usuarios"
            icon={Users}
          >
            {loading ? (
              <ChartSkeleton height={280} />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={stats.byAgeGroup}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="barAge" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#2E5AAC" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    horizontal={false}
                    stroke="#E2E8F0"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(14,165,233,0.05)' }}
                    contentStyle={tt.contentStyle}
                    labelStyle={tt.labelStyle}
                    itemStyle={tt.itemStyle}
                    formatter={(v: unknown) => [`${v} usuarios`, 'Total']}
                  />
                  <Bar
                    dataKey="value"
                    fill="url(#barAge)"
                    radius={[4, 8, 8, 4]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SectionCard
            title="Insights automaticos"
            subtitle="Analises geradas a partir dos dados"
            icon={Sparkles}
          >
            {loading ? (
              <ChartSkeleton height={220} />
            ) : (
              <div className="space-y-3">
                <InsightRow
                  color="fmp"
                  title={`${topRegion?.name ?? '—'} concentra ${
                    stats.total > 0
                      ? Math.round(
                          ((topRegion?.value ?? 0) / stats.total) * 100
                        )
                      : 0
                  }% dos usuarios`}
                  message="Considere campanhas de expansao para outras regioes."
                />
                <InsightRow
                  color="info"
                  title={`${conversion}% dos usuarios estao com matricula ativa`}
                  message={`${stats.prospectUsers} prospectos podem ser reativados.`}
                />
                <InsightRow
                  color="success"
                  title={`${stats.cityCount} cidades presentes na base`}
                  message="Boa capilaridade nacional; ha oportunidade em cidades novas."
                />
                <InsightRow
                  color="warning"
                  title={`${stats.alumniUsers} egressos identificados`}
                  message="Programas de relacionamento com egressos podem gerar receita recorrente."
                />
              </div>
            )}
          </SectionCard>

          <SectionCard
            className="lg:col-span-2"
            title="Top cidades"
            subtitle="Onde a base cresce mais rapido"
            icon={MapPin}
          >
            {loading ? (
              <ChartSkeleton height={280} />
            ) : stats.topCities.length === 0 ? (
              <EmptyState title="Sem cidades para exibir" />
            ) : (
              <div className="space-y-2">
                {stats.topCities.map((c, i) => {
                  const max = stats.topCities[0].value;
                  const pct = Math.round((c.value / max) * 100);
                  return (
                    <div
                      key={c.name}
                      className="rounded-xl bg-gray-50 p-3 animate-slide-up"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-2xs font-semibold text-gray-500 shadow-card">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {c.name}
                            </p>
                            <p className="text-2xs uppercase tracking-widest text-gray-500">
                              {c.state}
                            </p>
                          </div>
                        </div>
                        <Badge variant="fmp">{c.value} usuarios</Badge>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-fmp-light to-fmp"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </section>

        <section className="overflow-hidden rounded-2xl glass-dark p-5 text-white shadow-card animate-fade-in">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStat label="Sudeste" value={countRegion(stats.byRegion, 'Sudeste')} total={stats.total} />
            <MiniStat label="Sul" value={countRegion(stats.byRegion, 'Sul')} total={stats.total} />
            <MiniStat label="Nordeste" value={countRegion(stats.byRegion, 'Nordeste')} total={stats.total} />
            <MiniStat
              label="Centro-Oeste + Norte"
              value={
                countRegion(stats.byRegion, 'Centro-Oeste') +
                countRegion(stats.byRegion, 'Norte')
              }
              total={stats.total}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-fmp/30 bg-fmp-muted/40 p-5 animate-fade-in">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-2 text-fmp shadow-card">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-fmp-dark">
                  Adicione novos indicadores quando quiser
                </p>
                <p className="text-xs text-gray-600">
                  Este dashboard esta preparado para receber novos KPIs, filtros
                  e camadas de dados assim que voce definir.
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

function countRegion(
  arr: Array<{ name: string; value: number }>,
  name: string
) {
  return arr.find((r) => r.name === name)?.value ?? 0;
}

function MiniStat({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <p className="text-2xs uppercase tracking-widest text-white/50">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      <p className="text-2xs text-white/60">{pct}% do total</p>
    </div>
  );
}

function InsightRow({
  color,
  title,
  message,
}: {
  color: 'fmp' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
}) {
  const styles: Record<typeof color, { ring: string; dot: string; text: string }> = {
    fmp: { ring: 'ring-fmp/20', dot: 'bg-fmp', text: 'text-fmp-dark' },
    info: { ring: 'ring-info/20', dot: 'bg-info', text: 'text-info-dark' },
    success: {
      ring: 'ring-success/20',
      dot: 'bg-success',
      text: 'text-success-dark',
    },
    warning: {
      ring: 'ring-warning/20',
      dot: 'bg-warning',
      text: 'text-warning-dark',
    },
  };
  const s = styles[color];
  return (
    <div
      className={`flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-inset ${s.ring}`}
    >
      <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${s.dot}`} />
      <div className="min-w-0">
        <p className={`text-xs font-semibold ${s.text}`}>{title}</p>
        <p className="mt-0.5 text-2xs text-gray-500">{message}</p>
      </div>
    </div>
  );
}
