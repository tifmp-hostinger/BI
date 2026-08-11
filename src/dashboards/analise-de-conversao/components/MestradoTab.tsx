import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Users, GraduationCap, Radio, Receipt, TrendingUp } from 'lucide-react';
import { SectionCard } from '@/components/ui/SectionCard';
import { ReorderableGrid, RItem } from '@/components/ui/ReorderableGrid';
import { StatCard, StatCardSkeleton, STAT_GRID_CLASSES, STAT_GRID_CONTAINER } from '@/components/ui/StatCard';
import { GaugeSemicircle } from '@/components/ui/GaugeSemicircle';
import { ChartSkeleton } from '@/components/ui/Skeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtInt, fmtPct, truncateLabel } from '../formatters';
import type { MestradoData } from '../types';
import { CHART_TOOLTIP, CORES_CATEGORICAS, FMP_DARK, FMP_RED } from '@/lib/chartColors';
import { MEST_META } from '../constants';

const PIE_COLORS = CORES_CATEGORICAS;


type Props = {
  loading: boolean;
  data: MestradoData | null;
};

export function MestradoTab({ loading, data }: Props) {
  const tooltip = CHART_TOOLTIP;

  if (loading) {
    return (
      <>
        <section className={STAT_GRID_CONTAINER}>
          <div className={STAT_GRID_CLASSES}>
            {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} index={i} />)}
          </div>
        </section>
        <div className="h-56 animate-pulse rounded-md border border-line bg-white shadow-card" />
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => <ChartSkeleton key={i} height={360} />)}
        </section>
      </>
    );
  }

  if (!data) return null;

  return (
    <>
      <section className={STAT_GRID_CONTAINER}>
        <div className={STAT_GRID_CLASSES}>
          <StatCard index={0} label="Leads" value={fmtInt(data.leads)} icon={Users} color="fmp" highlight />
          <StatCard index={1} label="Inscrições" value={fmtInt(data.insc)} icon={Users} color="fmp" />
          <StatCard index={2} label="Matrículas" value={fmtInt(data.mat)} icon={GraduationCap} color="fmp" />
          <StatCard index={3} label="Taxas de inscrição pagas" value={fmtInt(data.taxaPaga)} hint="Contagem de taxas de inscrição pagas — não é valor em reais." icon={Receipt} color="gray" />
          <StatCard index={4} label="% Matrículas qualificadas" value={fmtPct(data.pctConversao)} hint="Matrículas com situação qualificada ÷ matrículas — fórmula herdada do relatório original." icon={TrendingUp} color="gray" />
        </div>
      </section>

      <div className="flex flex-col items-center rounded-md border border-line bg-white p-6 shadow-card animate-fade-in">
        <GaugeSemicircle
          value={data.pctMeta}
          label="Mestrado | Meta"
          size={220}
          formatValue={(v) => fmtPct(v)}
          caption={`${fmtInt(data.mat)} / ${fmtInt(MEST_META)} meta`}
        />
      </div>

      <ReorderableGrid storageKey="conv-reorder-mestrado" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RItem rid="insc-processo">
        <SectionCard title="Inscrições por Processo Seletivo" subtitle="Volume de inscrições por período letivo" icon={Users}>
          {data.inscPorProcesso.length === 0 ? (
            <EmptyState title="Sem dados para os filtros selecionados" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, data.inscPorProcesso.length * 32)}>
              <BarChart data={data.inscPorProcesso} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="barProcMest" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6E6B66' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => fmtInt(v)} />
                <YAxis type="category" dataKey="categoria" tick={{ fontSize: 10, fill: '#3A3838' }} tickLine={false} axisLine={false} width={160} tickFormatter={(v: string) => truncateLabel(v, 22)} />
                <Tooltip cursor={{ fill: 'rgba(238,42,66,0.05)' }} contentStyle={tooltip.contentStyle} labelStyle={tooltip.labelStyle} itemStyle={tooltip.itemStyle} formatter={(v: unknown) => [`${fmtInt(v as number)} inscrições`, 'Processo']} />
                <Bar dataKey="valor" fill="url(#barProcMest)" radius={[4, 8, 8, 4]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        </RItem>
        <RItem rid="status-insc">
        <SectionCard title="Status das Inscrições" subtitle="Situação de cada inscrição no processo seletivo" icon={Users}>
          {data.statusInscricoes.length === 0 || data.statusInscricoes.every((d) => d.valor === 0) ? (
            <EmptyState title="Sem dados para os filtros selecionados" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Tooltip contentStyle={tooltip.contentStyle} labelStyle={tooltip.labelStyle} itemStyle={tooltip.itemStyle} formatter={(v: unknown) => [fmtInt(v as number), 'Inscrições']} />
                  <Pie data={data.statusInscricoes} dataKey="valor" nameKey="categoria" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} stroke="none">
                    {data.statusInscricoes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 space-y-1.5">
                {data.statusInscricoes.map((r, i) => {
                  const total = data.statusInscricoes.reduce((s, x) => s + x.valor, 0);
                  const pct = total > 0 ? Math.round((r.valor / total) * 100) : 0;
                  return (
                    <li key={r.categoria} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-ink-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {r.categoria}
                      </span>
                      <span className="font-semibold text-ink">{fmtInt(r.valor)} ({pct}%)</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </SectionCard>

        </RItem>
        <RItem rid="leads-canal" className="lg:col-span-2">
        <SectionCard title="Leads Gerados por Canal" subtitle="Ranking dos canais que mais trouxeram interessados" icon={Radio}>
          {data.leadsPorCanal.length === 0 ? (
            <EmptyState title="Sem dados de canal para os filtros selecionados" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(300, Math.min(data.leadsPorCanal.length, 12) * 32)}>
              <BarChart data={data.leadsPorCanal.slice(0, 12)} layout="vertical" margin={{ top: 4, right: 48, left: 0, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6E6B66' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => fmtInt(v)} />
                <YAxis type="category" dataKey="categoria" tick={{ fontSize: 10, fill: '#3A3838' }} tickLine={false} axisLine={false} width={130} tickFormatter={(v: string) => truncateLabel(v, 20)} />
                <Tooltip
                  cursor={{ fill: 'rgba(238,42,66,0.05)' }}
                  contentStyle={tooltip.contentStyle}
                  labelStyle={tooltip.labelStyle}
                  itemStyle={tooltip.itemStyle}
                  formatter={(v: unknown) => {
                    const total = data.leadsPorCanal.reduce((soma, c) => soma + c.valor, 0);
                    const pct = total > 0 ? Math.round(((v as number) / total) * 100) : 0;
                    return [`${fmtInt(v as number)} leads (${pct}% do total)`, 'Canal'];
                  }}
                />
                <Bar dataKey="valor" radius={[4, 8, 8, 4]} maxBarSize={20}>
                  {data.leadsPorCanal.slice(0, 12).map((_, i) => (
                    <Cell key={i} fill={`rgba(238,42,66,${Math.max(0.35, 1 - (i * 0.65) / Math.max(1, Math.min(data.leadsPorCanal.length, 12) - 1)).toFixed(2)})`} />
                  ))}
                  <LabelList position="right" dataKey="valor" fill={FMP_DARK} stroke="none" fontSize={11} fontWeight={700} formatter={(v: unknown) => fmtInt(v as number)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
        </RItem>
      </ReorderableGrid>
    </>
  );
}
