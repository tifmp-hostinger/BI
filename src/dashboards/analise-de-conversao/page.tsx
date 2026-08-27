import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp, Users, Radio } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BarraContexto } from '@/components/layout/BarraContexto';
import { SectionCard } from '@/components/ui/SectionCard';
import { ReorderableGrid, RItem } from '@/components/ui/ReorderableGrid';
import { GaugeSemicircle } from '@/components/ui/GaugeSemicircle';
import { StatCard, STAT_GRID_CLASSES, STAT_GRID_CONTAINER } from '@/components/ui/StatCard';
import { ChartSkeleton, LoadingSteps } from '@/components/ui/Skeletons';
import { ErrorState } from '@/components/ui/ErrorState';
import { FONTES_POR_DASHBOARD } from '@/lib/dataFreshness';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAnaliseConversaoData } from './hooks/useAnaliseConversaoData';
import { ConversaoFilterBar } from './components/ConversaoFilterBar';
import { GraduacaoTab } from './components/GraduacaoTab';
import { RematriculaTab } from './components/RematriculaTab';
import { MestradoTab } from './components/MestradoTab';
import { EspecializacoesTab } from './components/EspecializacoesTab';
import { ModalidadePosTab } from './components/ModalidadePosTab';
import { CursosLivresTab } from './components/CursosLivresTab';
import { fmtBRL, fmtBRLCompact, fmtInt, fmtPct, truncateLabel } from './formatters';
import { formatPeriodoLetivo } from '@/lib/formatters';
import { CHART_TOOLTIP, FMP_DARK, FMP_RED, NEUTRAL } from '@/lib/chartColors';
import type { ConversaoFilters } from './types';

type Tab =
  | 'geral'
  | 'leads'
  | 'graduacao'
  | 'rematricula'
  | 'especializacoes'
  | 'presencial'
  | 'ead'
  | 'cursoslivres'
  | 'mestrado';

const TABS: { id: Tab; label: string }[] = [
  { id: 'geral', label: 'Geral' },
  { id: 'leads', label: 'Leads' },
  { id: 'graduacao', label: 'Graduação' },
  { id: 'rematricula', label: 'Rematrícula' },
  { id: 'especializacoes', label: 'Especializações' },
  { id: 'presencial', label: 'Presencial' },
  { id: 'ead', label: 'EAD' },
  { id: 'cursoslivres', label: 'Cursos Livres' },
  { id: 'mestrado', label: 'Mestrado' },
];

const OBS_PROCESSO_FINALIZADO = 'OBS.: Processo Seletivo Finalizado';

export function AnaliseDeConversaoPage() {
  const [tab, setTab] = useState<Tab>('geral');
  const [filters, setFilters] = useState<ConversaoFilters>({
    codperlet: [],
    ano: [],
    mes: [],
    dataInicio: null,
    dataFim: null,
  });

  const { loading, revalidando, error, progress, filterOptions, geralKpis, leadsData, graduacaoData, rematriculaData, mestradoData, especializacoesData, presencialData, eadData, cursosLivresData, freshnessRitmos, refetch } =
    useAnaliseConversaoData(filters, tab);

  const tt = CHART_TOOLTIP;

  return (
    <AppShell
      title="Análise de Conversão"
      subtitle="Funil comercial acadêmico completo - Graduação, Especializações, Mestrado e Cursos Livres"
    >
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Idem Presidência: a aba Geral já tem os quatro gauges de meta
            como hierarquia; um destaque extra competiria com eles. */}
        <BarraContexto
          descricao="Funil comercial completo — leads, inscrições e matrículas por processo (Graduação, Especializações, Mestrado e Cursos Livres) —, com os mesmos números do relatório original do Power BI."
          tabelas={FONTES_POR_DASHBOARD['analise-de-conversao']}
          ritmos={freshnessRitmos}
          revalidando={revalidando}
          onAtualizar={refetch}
        />

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Abas do dashboard"
          className="flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-line bg-white p-1 shadow-card sm:w-fit sm:flex-wrap sm:overflow-visible"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-pill px-4 py-2 text-xs font-semibold transition ${
                tab === t.id
                  ? 'bg-fmp text-white shadow-glow'
                  : 'text-ink-2 hover:bg-paper'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {filterOptions && (
          <ConversaoFilterBar
            options={filterOptions}
            filters={filters}
            onCodperletChange={(v) => setFilters((f) => ({ ...f, codperlet: v }))}
            onAnoChange={(v) => setFilters((f) => ({ ...f, ano: v }))}
            onMesChange={(v) => setFilters((f) => ({ ...f, mes: v }))}
            onDataInicioChange={(v) => setFilters((f) => ({ ...f, dataInicio: v }))}
            onDataFimChange={(v) => setFilters((f) => ({ ...f, dataFim: v }))}
          />
        )}

        {loading && progress && <LoadingSteps mensagem={progress} />}

        {error && (
          <ErrorState
            title="Não foi possível carregar os dados"
            message={error}
            onRetry={refetch}
          />
        )}

        {/* GERAL */}
        {tab === 'geral' && (
          <>
            {loading ? (
              <section className={STAT_GRID_CONTAINER}>
                <div className={STAT_GRID_CLASSES}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-56 animate-pulse rounded-md border border-line bg-white shadow-card" />
                  ))}
                </div>
              </section>
            ) : geralKpis ? (
              <>
                <section className={STAT_GRID_CONTAINER}>
                  <div className={STAT_GRID_CLASSES}>
                    <GaugeCard
                      label={`Graduação | ${formatPeriodoLetivo(geralKpis.gradPeriodoAtual)}`}
                      value={geralKpis.gradPctMetaAtual}
                      caption={`${fmtInt(geralKpis.gradMatEfetAtual)} / ${fmtInt(geralKpis.gradVagasAtual)} vagas`}
                    />
                    {/* OBS de processo encerrado só no período ANTERIOR — que
                        por definição já terminou. No vigente, a nota afirmava
                        algo possivelmente falso. */}
                    <GaugeCard
                      label={`Graduação | ${formatPeriodoLetivo(geralKpis.gradPeriodoAnterior)}`}
                      value={geralKpis.gradPctMetaAnterior}
                      caption={`${fmtInt(geralKpis.gradMatEfetAnterior)} / ${fmtInt(geralKpis.gradVagasAnterior)} vagas`}
                      obsFinalizado
                    />
                    <GaugeCard
                      label="Especializações | Meta"
                      value={geralKpis.especPctMeta}
                      caption={`${fmtBRLCompact(geralKpis.especFat)} / ${fmtBRLCompact(geralKpis.especMetaFat)} meta`}
                    />
                    <GaugeCard
                      label={`Mestrado ${geralKpis.mestAno} | Meta`}
                      value={geralKpis.mestPctMeta}
                      caption={`${fmtInt(geralKpis.mestMat)} / ${fmtInt(geralKpis.mestMeta)} meta`}
                    />
                  </div>
                </section>

                {/* O terceiro card (Matrículas do Mestrado) saiu: o mesmo
                    número já aparece no caption do gauge logo acima. */}
                <section className={STAT_GRID_CONTAINER}>
                  <div className={STAT_GRID_CLASSES}>
                    <StatCard
                      index={0}
                      label="Especializações - Faturamento EAD"
                      value={fmtBRLCompact(geralKpis.especFatEad)}
                      exactValue={fmtBRL(geralKpis.especFatEad)}
                      subtitle="Cursos de pós na modalidade a distância"
                      icon={TrendingUp}
                      color="fmp"
                    />
                    <StatCard
                      index={1}
                      label="Especializações - Faturamento Presencial"
                      value={fmtBRLCompact(geralKpis.especFatPres)}
                      exactValue={fmtBRL(geralKpis.especFatPres)}
                      subtitle="Cursos de pós presenciais"
                      icon={TrendingUp}
                      color="gray"
                    />
                  </div>
                </section>
              </>
            ) : null}
          </>
        )}

        {/* LEADS */}
        {tab === 'leads' && (
          <>
            {loading ? (
              <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ChartSkeleton key={i} height={360} />
                ))}
              </section>
            ) : leadsData ? (
              <>
                <ReorderableGrid storageKey="conv-reorder-leads" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <RItem rid="leads-grad">
                    <LeadsComportamentoChart
                      titulo="Comportamento - Leads Graduação"
                      dados={leadsData.gradMensal}
                      gradientId="barLeadsGrad"
                      tt={tt}
                    />
                  </RItem>
                  <RItem rid="leads-espec">
                    <LeadsComportamentoChart
                      titulo="Comportamento - Leads Especializações"
                      dados={leadsData.especMensal}
                      gradientId="barLeadsEspec"
                      tt={tt}
                    />
                  </RItem>
                  <RItem rid="leads-mest">
                    <LeadsComportamentoChart
                      titulo="Comportamento - Leads Mestrado"
                      dados={leadsData.mestMensal}
                      gradientId="barLeadsMest"
                      tt={tt}
                    />
                  </RItem>
                  <RItem rid="leads-canal">
                  <SectionCard
                    title="Leads Gerados por Canal"
                    subtitle="Ranking dos canais que mais trouxeram interessados"
                    icon={Radio}
                  >
                    {leadsData.leadsPorCanal.length === 0 ? (
                      <EmptyState title="Sem dados de canal para os filtros selecionados" />
                    ) : (
                      <ResponsiveContainer width="100%" height={Math.max(300, Math.min(leadsData.leadsPorCanal.length, 20) * 24)}>
                        <BarChart
                          data={leadsData.leadsPorCanal.slice(0, 20)}
                          layout="vertical"
                          margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
                        >
                          <defs>
                            <linearGradient id="barCanal" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
                              <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid horizontal={false} stroke="#DEDCD4" />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: '#6E6B66' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) => fmtInt(v)}
                          />
                          <YAxis
                            type="category"
                            dataKey="categoria"
                            tick={{ fontSize: 10, fill: '#3A3838' }}
                            tickLine={false}
                            axisLine={false}
                            width={180}
                            tickFormatter={(v: string) => truncateLabel(v, 26)}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(238,42,66,0.05)' }}
                            contentStyle={tt.contentStyle}
                            labelStyle={tt.labelStyle}
                            itemStyle={tt.itemStyle}
                            formatter={(v: unknown) => {
                              const total = leadsData.leadsPorCanal.reduce((soma, c) => soma + c.valor, 0);
                              const pct = total > 0 ? Math.round(((v as number) / total) * 100) : 0;
                              return [`${fmtInt(v as number)} leads (${pct}% do total)`, 'Canal'];
                            }}
                          />
                          <Bar dataKey="valor" fill="url(#barCanal)" radius={[4, 8, 8, 4]} maxBarSize={22}>
                            <LabelList
                              dataKey="valor"
                              position="right"
                              formatter={(v: unknown) => fmtInt(v as number)}
                              style={{ fontSize: 10, fill: '#3A3838', fontWeight: 600 }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </SectionCard>
                  </RItem>

                  {/* O gráfico "Entrada de Leads" saiu: replotava as mesmas
                      séries mensais de Graduação e Especializações já
                      visíveis nos dois primeiros cards. */}
                </ReorderableGrid>
              </>
            ) : null}
          </>
        )}

        {/* GRADUACAO */}
        {tab === 'graduacao' && (
          <ErrorBoundary><GraduacaoTab loading={loading} data={graduacaoData} /></ErrorBoundary>
        )}

        {/* REMATRICULA */}
        {tab === 'rematricula' && (
          <ErrorBoundary><RematriculaTab loading={loading} data={rematriculaData} /></ErrorBoundary>
        )}

        {/* MESTRADO */}
        {tab === 'mestrado' && (
          <ErrorBoundary><MestradoTab loading={loading} data={mestradoData} /></ErrorBoundary>
        )}

        {/* ESPECIALIZACOES */}
        {tab === 'especializacoes' && (
          <ErrorBoundary><EspecializacoesTab loading={loading} data={especializacoesData} /></ErrorBoundary>
        )}

        {/* PRESENCIAL */}
        {tab === 'presencial' && (
          <ErrorBoundary><ModalidadePosTab loading={loading} data={presencialData} /></ErrorBoundary>
        )}

        {/* EAD */}
        {tab === 'ead' && (
          <ErrorBoundary><ModalidadePosTab loading={loading} data={eadData} /></ErrorBoundary>
        )}

        {/* CURSOS LIVRES */}
        {tab === 'cursoslivres' && (
          <ErrorBoundary><CursosLivresTab loading={loading} data={cursosLivresData} /></ErrorBoundary>
        )}
      </div>
    </AppShell>
  );
}

function GaugeCard({
  label,
  value,
  caption,
  obsFinalizado,
}: {
  label: string;
  value: number;
  caption?: string;
  obsFinalizado?: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-md border border-line bg-white p-6 shadow-card animate-fade-in">
      <GaugeSemicircle
        value={value}
        label={label}
        size={220}
        formatValue={(v) => fmtPct(v)}
        caption={caption}
      />
      {obsFinalizado && (
        <p className="mt-3 text-2xs italic text-ink-3">{OBS_PROCESSO_FINALIZADO}</p>
      )}
    </div>
  );
}

/**
 * Card mensal de leads com linhas de conversão — o mesmo desenho para
 * Graduação, Especializações e Mestrado (antes eram três blocos copiados).
 */
function LeadsComportamentoChart({
  titulo,
  dados,
  gradientId,
  tt,
}: {
  titulo: string;
  dados: { mesAno: string; leads: number; convLeadsInsc: number; convLeadsMat: number }[];
  gradientId: string;
  tt: typeof CHART_TOOLTIP;
}) {
  return (
    <SectionCard
      title={titulo}
      subtitle="Colunas: leads | Linhas: quantos viraram inscrição / matrícula"
      icon={Users}
    >
      {dados.every((d) => d.leads === 0) ? (
        <EmptyState title="Sem dados de leads para os filtros selecionados" />
      ) : (
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={dados} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
                <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#DEDCD4" />
            <XAxis
              dataKey="mesAno"
              tick={{ fontSize: 9, fill: '#6E6B66' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => truncateLabel(v, 10)}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11, fill: '#6E6B66' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tt.contentStyle} labelStyle={tt.labelStyle} itemStyle={tt.itemStyle} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              formatter={(v: string) => {
                const labels: Record<string, string> = {
                  Leads: 'Leads',
                  'Conv. p/ Inscrição': 'Conv. p/ Inscrição',
                  'Conv. p/ Matrícula': 'Conv. p/ Matrícula',
                };
                return <span className="text-xs text-ink-2">{labels[v] ?? v}</span>;
              }}
            />
            <Bar dataKey="leads" name="Leads" fill={`url(#${gradientId})`} radius={[8, 8, 4, 4]} maxBarSize={36} />
            <Line type="monotone" dataKey="convLeadsInsc" name="Conv. p/ Inscrição" stroke={NEUTRAL} strokeWidth={2.5} dot={{ r: 3, fill: NEUTRAL }} />
            <Line type="monotone" dataKey="convLeadsMat" name="Conv. p/ Matrícula" stroke={FMP_DARK} strokeWidth={2.5} dot={{ r: 3, fill: FMP_DARK }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}
