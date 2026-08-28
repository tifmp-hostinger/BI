import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  GraduationCap,
  Percent,
  TrendingDown,
  Users,
  Wallet,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BarraContexto } from '@/components/layout/BarraContexto';
import { KpiDestaque, KpiDestaqueSkeleton } from '@/components/ui/KpiDestaque';
import { StatCard, StatCardSkeleton, STAT_GRID_CLASSES, STAT_GRID_CONTAINER } from '@/components/ui/StatCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { ChartSkeleton } from '@/components/ui/Skeletons';
import { ErrorState } from '@/components/ui/ErrorState';
import { FONTES_POR_DASHBOARD } from '@/lib/dataFreshness';
import { EmptyState } from '@/components/ui/EmptyState';
import { CHART_TOOLTIP, CORES_CATEGORICAS, FMP_DARK, FMP_RED, NEUTRAL } from '@/lib/chartColors';
import { useBolsasDescontosData } from './hooks/useBolsasDescontosData';
import { useEstiloVisualizacao } from '@/lib/estiloVisualizacao';
import { BarraProporcao } from '@/components/ui/BarraProporcao';
import { BolsasFilterBar } from './components/BolsasFilterBar';
import { fmtBRL, fmtBRLCompact, fmtInt, truncateLabel } from './formatters';
import type { BolsasFilters } from './types';

const COLORS = CORES_CATEGORICAS;

type Tab = 'panorama' | 'evasao';

export function BolsasEDescontosPage() {
  const estilo = useEstiloVisualizacao();
  const [tab, setTab] = useState<Tab>('panorama');
  const [filters, setFilters] = useState<BolsasFilters>({
    codperlet: [],
    ano: [],
    tipocurso: [],
    bolsaPadronizada: [],
  });

  const {
    filterOptions,
    optionsLoading,
    panorama,
    panoramaLoading,
    panoramaError,
    evasao,
    evasaoLoading,
    evasaoError,
    freshnessRitmos,
    revalidando,
    refetch,
  } = useBolsasDescontosData(filters);

  const tt = CHART_TOOLTIP;

  // Filtro padrão realista: o painel abre no ANO CORRENTE (com chip visível
  // e removível) em vez de agregar o histórico inteiro desde ~2000. Aplicado
  // DURANTE o render (padrão "adjust state during render"): num useEffect o
  // usuário via um frame com os números do histórico completo antes de tudo
  // trocar sozinho para o ano corrente. Se o ano atual não tem dado, cai
  // para o mais recente que tem.
  const anoDefaultAplicado = useRef(false);
  if (!anoDefaultAplicado.current && filterOptions) {
    anoDefaultAplicado.current = true;
    const anoAtual = new Date().getFullYear();
    const alvo = filterOptions.anoOptions.includes(anoAtual)
      ? anoAtual
      : filterOptions.anoOptions[0];
    if (alvo !== undefined && filters.ano.length === 0) {
      setFilters((f) => ({ ...f, ano: [alvo] }));
    }
  }

  const loading = tab === 'panorama' ? panoramaLoading : evasaoLoading;
  const error = tab === 'panorama' ? panoramaError : evasaoError;

  return (
    <AppShell
      title="Bolsas e Descontos"
      subtitle="Performance e retenção de benefícios financeiros"
    >
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Faixa de contexto — ver comentário em BarraContexto: o hero
            escuro consumia 286px do topo repetindo o título da barra
            superior e empurrando o primeiro número para 73% da tela. */}
        <BarraContexto
          descricao="Performance e retenção de matrículas com benefícios financeiros: panorama de bolsas, descontos e faturamento, além da evasão relacionada a benefícios. Os cálculos replicam o relatório original do Power BI, incluindo regras históricas de contagem."
          tabelas={FONTES_POR_DASHBOARD['bolsas-e-descontos']}
          ritmos={freshnessRitmos}
          revalidando={revalidando}
          onAtualizar={refetch}
        />

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-md border border-line bg-card p-1 shadow-card w-fit">
          <button
            type="button"
            onClick={() => setTab('panorama')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === 'panorama'
                ? 'bg-fmp text-white shadow-glow'
                : 'text-ink-2 hover:bg-paper'
            }`}
          >
            Panorama Geral
          </button>
          <button
            type="button"
            onClick={() => setTab('evasao')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === 'evasao'
                ? 'bg-fmp text-white shadow-glow'
                : 'text-ink-2 hover:bg-paper'
            }`}
          >
            Evasão
          </button>
        </div>

        {/* Filters */}
        {!optionsLoading && filterOptions && (
          <BolsasFilterBar
            options={filterOptions}
            codperlet={filters.codperlet}
            ano={filters.ano}
            tipocurso={filters.tipocurso}
            bolsaPadronizada={filters.bolsaPadronizada}
            onCodperletChange={(v) => setFilters((f) => ({ ...f, codperlet: v }))}
            onAnoChange={(v) => setFilters((f) => ({ ...f, ano: v }))}
            onTipocursoChange={(v) => setFilters((f) => ({ ...f, tipocurso: v }))}
            onBolsaPadronizadaChange={(v) => setFilters((f) => ({ ...f, bolsaPadronizada: v }))}
          />
        )}

        {error && (
          <ErrorState
            title="Não foi possível carregar os dados"
            message={error}
            onRetry={refetch}
          />
        )}

        {/* Panorama Geral */}
        {tab === 'panorama' && (
          <>
            {/* Indicador principal + apoio.
                A renúncia (original − líquido) é a pergunta que este painel
                existe para responder — "quanto a FMP abre mão concedendo
                benefícios" — e até aqui o usuário precisava subtrair de
                cabeça dois cards. É derivada dos mesmos números já exibidos,
                sem consulta nova. */}
            <section className={STAT_GRID_CONTAINER}>
              {/* 5 colunas: o destaque ocupa 2 colunas x 2 linhas e os seis
                  cards de apoio preenchem exatamente o bloco 3x2 ao lado —
                  sem sobra de espaço morto sob os números. */}
              <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @4xl:grid-cols-5">
                {loading && (
                  <>
                    <KpiDestaqueSkeleton className="@md:col-span-2 @4xl:row-span-2" />
                    {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} index={i} />)}
                  </>
                )}
                {!loading && panorama && (() => {
                  const original = panorama.kpis.fatOriginalPrevisto;
                  const liquido = panorama.kpis.fatDescontoPrevisto;
                  const renuncia = original - liquido;
                  const fatia = original > 0 ? renuncia / original : null;
                  return (
                    <>
                      <KpiDestaque
                        className="@md:col-span-2 @4xl:row-span-2"
                        rotulo="Renúncia prevista em benefícios"
                        valor={fmtBRLCompact(renuncia)}
                        exato={fmtBRL(renuncia)}
                        hint="Diferença entre o valor original das mensalidades e o valor líquido depois de bolsas e descontos — quanto a FMP deixa de faturar para conceder os benefícios do recorte filtrado. Indicador derivado, sem equivalente direto no relatório original."
                        icon={TrendingDown}
                        proporcao={fatia ?? undefined}
                        proporcaoRotulo={
                          fatia !== null
                            ? `${Math.round(fatia * 100)}% do faturamento original de ${fmtBRLCompact(original)}`
                            : undefined
                        }
                        apoio={
                          <>
                            Restam <strong className="font-semibold text-ink">{fmtBRLCompact(liquido)}</strong>{' '}
                            de faturamento líquido previsto, distribuídos em{' '}
                            <strong className="font-semibold text-ink">{fmtInt(panorama.kpis.matBeneFin)}</strong>{' '}
                            matrículas com benefício.
                          </>
                        }
                      />
                      <StatCard index={0} label="Faturamento original previsto" value={fmtBRLCompact(original)} exactValue={fmtBRL(original)} hint="Soma do valor original das mensalidades do recorte, antes de bolsas e descontos." icon={Wallet} color="fmp" />
                      <StatCard index={1} label="Faturamento líquido previsto" value={fmtBRLCompact(liquido)} exactValue={fmtBRL(liquido)} hint="Faturamento previsto após aplicar bolsas e descontos." icon={Wallet} color="gray" />
                      <StatCard index={2} label="Matrículas" value={fmtInt(panorama.kpis.matriculas)} hint="Alunos únicos (RA) matriculados no período. Este card reage só aos filtros de Período e Ano — Nível e Benefício não se aplicam a ele." icon={Users} color="fmp" />
                      <StatCard index={3} label="Bolsas" value={fmtInt(panorama.kpis.bolsas)} hint="Ocorrências de bolsa nas matrículas do recorte filtrado." icon={Award} color="fmp" />
                      <StatCard index={4} label="Descontos" value={fmtInt(panorama.kpis.descontos)} hint="Ocorrências de desconto nas matrículas do recorte filtrado." icon={Percent} color="gray" />
                      <StatCard index={5} label="Formados" value={fmtInt(panorama.kpis.formados)} icon={GraduationCap} color="gray" />
                    </>
                  );
                })()}
              </div>
            </section>

            {/* Charts 2x2 */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* 1. Waterfall — Top 5 Descontos */}
              <SectionCard title="Top 5 Descontos com Maior Nº de Ocorrências" subtitle="Agrupado por tipo de benefício" icon={Percent}>
                {loading ? (
                  <ChartSkeleton height={320} />
                ) : !panorama || panorama.topDescontos.length === 0 ? (
                  <EmptyState title="Sem dados para os filtros selecionados" />
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={panorama.topDescontos} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="barDesc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.95} />
                          <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.85} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#2B2830" />
                      <XAxis
                        dataKey="categoria"
                        tick={{ fontSize: 10, fill: '#9B97A1' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: string) => truncateLabel(v, 12)}
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                        height={72}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#9B97A1' }} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,77,99,0.10)' }}
                        contentStyle={tt.contentStyle}
                        labelStyle={tt.labelStyle}
                        itemStyle={tt.itemStyle}
                        formatter={(v: unknown) => [`${fmtInt(v as number)} ocorrências`, 'Descontos']}
                      />
                      <Bar dataKey="valor" fill="url(#barDesc)" radius={[8, 8, 4, 4]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>

              {/* 2. Area — Nº Ocorrências por Bolsa */}
              <SectionCard title="Nº Ocorrências por Bolsa" subtitle="Agrupado por tipo de benefício" icon={Award}>
                {loading ? (
                  <ChartSkeleton height={320} />
                ) : !panorama || panorama.ocorrenciasBolsa.length === 0 ? (
                  <EmptyState title="Sem dados para os filtros selecionados" />
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(320, panorama.ocorrenciasBolsa.length * 22)}>
                    <BarChart
                      data={panorama.ocorrenciasBolsa}
                      layout="vertical"
                      margin={{ top: 4, right: 48, left: 0, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient id="barOcorrencias" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid horizontal={false} stroke="#2B2830" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#9B97A1' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => fmtInt(v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="categoria"
                        tick={{ fontSize: 10, fill: '#D7D4CE' }}
                        tickLine={false}
                        axisLine={false}
                        width={120}
                        tickFormatter={(v: string) => truncateLabel(v, 18)}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,77,99,0.10)' }}
                        contentStyle={tt.contentStyle}
                        labelStyle={tt.labelStyle}
                        itemStyle={tt.itemStyle}
                        formatter={(v: unknown) => [`${fmtInt(v as number)} ocorrências`, 'Bolsas']}
                      />
                      <Bar dataKey="valor" fill="url(#barOcorrencias)" radius={[4, 8, 8, 4]} maxBarSize={22}>
                        <LabelList
                          dataKey="valor"
                          position="right"
                          formatter={(v: unknown) => fmtInt(v as number)}
                          style={{ fontSize: 10, fill: '#D7D4CE', fontWeight: 600 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>

              {/* 3. Proporção Bolsas vs Descontos — barra única com %: numa
                  "distribuição" de só duas categorias, o % é a resposta; o
                  donut antigo ocupava 320px para codificar 2 números que os
                  cards acima já mostram. */}
              <SectionCard title="Distribuição dos Benefícios Financeiros" subtitle="Participação de bolsas e descontos no recorte" icon={Percent}>
                {loading ? (
                  <ChartSkeleton height={320} />
                ) : !panorama || panorama.distribuicao.length === 0 ||
                  panorama.distribuicao.every((d) => d.valor === 0) ? (
                  <EmptyState title="Sem dados para os filtros selecionados" />
                ) : (
                  <DistribuicaoProporcao dados={panorama.distribuicao} />
                )}
              </SectionCard>

              {/* 4. Columns — Top 5 Cursos de Maior Faturamento - Descontos */}
              <SectionCard title="Top 5 Cursos de Maior Faturamento - Descontos" subtitle="Categoria: curso" icon={Wallet}>
                {loading ? (
                  <ChartSkeleton height={320} />
                ) : !panorama || panorama.topCursosFat.length === 0 ? (
                  <EmptyState title="Sem dados para os filtros selecionados" />
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={panorama.topCursosFat} layout="vertical" margin={{ top: 4, right: 80, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="barCurso" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.95} />
                          <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.85} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid horizontal={false} stroke="#2B2830" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#9B97A1' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => fmtBRLCompact(v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="categoria"
                        tick={{ fontSize: 10, fill: '#D7D4CE' }}
                        tickLine={false}
                        axisLine={false}
                        width={110}
                        tickFormatter={(v: string) => truncateLabel(v, 16)}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,77,99,0.10)' }}
                        contentStyle={tt.contentStyle}
                        labelStyle={tt.labelStyle}
                        itemStyle={tt.itemStyle}
                        formatter={(v: unknown) => [fmtBRLCompact(v as number), 'Faturamento']}
                      />
                      <Bar dataKey="valor" fill="url(#barCurso)" radius={[4, 8, 8, 4]} maxBarSize={28}>
                        <LabelList
                          dataKey="valor"
                          position="right"
                          formatter={(v: unknown) => fmtBRLCompact(v as number)}
                          style={{ fontSize: 11, fill: '#D7D4CE', fontWeight: 700 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>
            </section>
          </>
        )}

        {/* Evasão */}
        {tab === 'evasao' && (
          <>
            {/* Renúncia card */}
            <section className={STAT_GRID_CONTAINER}>
              <div className={STAT_GRID_CLASSES}>
                {loading && <StatCardSkeleton index={0} />}
                {!loading && evasao && (
                  <StatCard
                    index={0}
                    label="Renúncia de valor - Evasão"
                    value={fmtBRLCompact(evasao.renunciaValorEvasao)}
                    exactValue={fmtBRL(evasao.renunciaValorEvasao)}
                    subtitle="Soma do valor original das matrículas evadidas"
                    icon={TrendingDown}
                    color="danger"
                    highlight
                  />
                )}
              </div>
            </section>

            {/* Charts */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* 1. Ranking — Top 10 Benefícios com Maior Evasão. Era um
                  "funil", mas o dado é um RANKING: a metáfora de etapas
                  enganava e as margens de 180px por lado zeravam a área útil
                  no celular. Barras horizontais na rampa vermelha da marca. */}
              <SectionCard title="Top 10 Benefícios Financeiros com Maior Evasão" subtitle="Agrupado por tipo de benefício" icon={TrendingDown}>
                {loading ? (
                  <ChartSkeleton height={360} />
                ) : !evasao || evasao.evasaoBeneficios.length === 0 ? (
                  <EmptyState title="Sem dados para os filtros selecionados" />
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(300, evasao.evasaoBeneficios.length * 32)}>
                    <BarChart
                      data={evasao.evasaoBeneficios}
                      layout="vertical"
                      margin={{ top: 4, right: 48, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid horizontal={false} stroke="#2B2830" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#9B97A1' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => fmtInt(v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="categoria"
                        tick={{ fontSize: 10, fill: '#D7D4CE' }}
                        tickLine={false}
                        axisLine={false}
                        width={120}
                        tickFormatter={(v: string) => truncateLabel(v, 18)}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,77,99,0.10)' }}
                        contentStyle={tt.contentStyle}
                        labelStyle={tt.labelStyle}
                        itemStyle={tt.itemStyle}
                        formatter={(v: unknown) => [`${fmtInt(v as number)} evasões`, 'Evasão']}
                      />
                      {/* Cor única: a posição já ordena e o comprimento já
                          codifica o valor — a rampa de opacidade repetia isso
                          e pintava os últimos de rosa-pálido. */}
                      <Bar dataKey="valor" fill={FMP_RED} radius={[4, 8, 8, 4]} maxBarSize={20}>
                        <LabelList
                          dataKey="valor"
                          position="right"
                          formatter={(v: unknown) => fmtInt(v as number)}
                          style={{ fontSize: 10, fill: '#B81E32', fontWeight: 700 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>

              {/* 2. Combined — Evasão por Ano */}
              <SectionCard
                title="Evasão por Ano"
                subtitle={estilo === 'nova' ? 'Matrículas com benefício e evasões, na mesma escala' : 'Colunas: matrículas com benefício | Linha: evasão'}
                icon={TrendingDown}
              >
                {loading ? (
                  <ChartSkeleton height={360} />
                ) : !evasao || evasao.evasaoPorAno.length === 0 ? (
                  <EmptyState title="Sem dados para os filtros selecionados" />
                ) : (
                  <ResponsiveContainer width="100%" height={360}>
                    <ComposedChart data={evasao.evasaoPorAno} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="barAno" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#2B2830" />
                      <XAxis
                        dataKey="ano"
                        tick={{ fontSize: 11, fill: '#9B97A1' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      {/* 'nova': UM eixo — as duas séries são contagens, e o
                          segundo eixo fazia a distância barra/linha parecer
                          significar algo. A linha de evasão fica baixa perto
                          das colunas? É a proporção real. 'classica': dois
                          eixos com tick na cor da série, como no BI. */}
                      {estilo === 'nova' ? (
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 11, fill: '#9B97A1' }}
                          tickLine={false}
                          axisLine={false}
                        />
                      ) : (
                        <>
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 11, fill: FMP_DARK }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 11, fill: '#9B97A1' }}
                            tickLine={false}
                            axisLine={false}
                          />
                        </>
                      )}
                      <Tooltip
                        contentStyle={tt.contentStyle}
                        labelStyle={tt.labelStyle}
                        itemStyle={tt.itemStyle}
                        formatter={(v: unknown, name: unknown) => {
                          if (name === 'matBeneFin') return [`${fmtInt(v as number)}`, 'Mat. com Benefício'];
                          // Sem "% das matrículas" aqui: numerador (toda linha
                          // com situação de evasão) e denominador (só situação
                          // Matriculado) são populações diferentes — a razão
                          // podia passar de 100% e virava desinformação.
                          return [`${fmtInt(v as number)}`, 'Evasão'];
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(v: string) => {
                          const label = v === 'matBeneFin' ? 'Mat. com Benefício' : 'Evasão';
                          return <span className="text-xs text-ink-2">{label}</span>;
                        }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="matBeneFin"
                        fill="url(#barAno)"
                        radius={[8, 8, 4, 4]}
                        maxBarSize={36}
                      />
                      <Line
                        yAxisId={estilo === 'nova' ? 'left' : 'right'}
                        type="monotone"
                        dataKey="evasaoBolsas"
                        stroke={estilo === 'nova' ? FMP_DARK : NEUTRAL}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: estilo === 'nova' ? FMP_DARK : NEUTRAL }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>

              {/* 3. Donut — Evasão por Modalidade */}
              <SectionCard title="Evasão com Benefícios Financeiros por Modalidade" subtitle="Categoria: tipo de curso" icon={GraduationCap}>
                {loading ? (
                  <ChartSkeleton height={360} />
                ) : !evasao || evasao.evasaoPorModalidade.length === 0 ||
                  evasao.evasaoPorModalidade.every((d) => d.valor === 0) ? (
                  <EmptyState title="Sem dados para os filtros selecionados" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Tooltip
                          contentStyle={tt.contentStyle}
                          labelStyle={tt.labelStyle}
                          itemStyle={tt.itemStyle}
                          formatter={(v: unknown) => [`${fmtInt(v as number)} evasões`, '']}
                        />
                        <Pie
                          data={evasao.evasaoPorModalidade}
                          dataKey="valor"
                          nameKey="categoria"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {evasao.evasaoPorModalidade.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <ul className="mt-2 space-y-1.5">
                      {evasao.evasaoPorModalidade.map((r, i) => {
                        const total = evasao.evasaoPorModalidade.reduce((s, x) => s + x.valor, 0);
                        const pct = total > 0 ? Math.round((r.valor / total) * 100) : 0;
                        return (
                          <li key={r.categoria} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 text-ink-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ background: COLORS[i % COLORS.length] }}
                              />
                              {r.categoria}
                            </span>
                            <span className="font-semibold text-ink">
                              {fmtInt(r.valor)} <span className="text-ink-3">({pct}%)</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </SectionCard>
            </section>
          </>
        )}

        {/* Footer note */}
        <section className="rounded-md border border-dashed border-fmp/30 bg-fmp-muted p-5 animate-fade-in">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-sm bg-card p-2 text-fmp shadow-card">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <p
                  className="text-sm font-semibold text-ink"
                  style={{ fontFamily: '"Noto Serif", serif', fontStyle: 'italic', fontWeight: 600 }}
                >
                  Regras herdadas do Power BI
                </p>
                <p className="text-xs text-ink-2">
                  Os cálculos replicam o relatório original do Power BI,
                  incluindo regras históricas de contagem — os números seguem
                  comparáveis com o BI anterior.
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

/**
 * Barra de proporção Bolsas vs Descontos — a forma nasceu aqui e foi
 * generalizada em components/ui/BarraProporcao; este wrapper só acrescenta a
 * nota de total do recorte.
 */
function DistribuicaoProporcao({ dados }: { dados: { categoria: string; valor: number }[] }) {
  const total = dados.reduce((soma, d) => soma + d.valor, 0);
  return (
    <BarraProporcao
      dados={dados}
      formatarValor={fmtInt}
      nota={`${fmtInt(total)} benefícios no recorte filtrado.`}
      className="h-full min-h-[280px]"
    />
  );
}
