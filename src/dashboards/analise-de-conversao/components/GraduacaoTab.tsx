import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GraduationCap, Users, TrendingUp } from 'lucide-react';
import { SectionCard } from '@/components/ui/SectionCard';
import { ReorderableGrid, RItem } from '@/components/ui/ReorderableGrid';
import { StatCard, StatCardSkeleton, STAT_GRID_CLASSES, STAT_GRID_CONTAINER } from '@/components/ui/StatCard';
import { GaugeSemicircle } from '@/components/ui/GaugeSemicircle';
import { ChartSkeleton } from '@/components/ui/Skeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtInt, fmtPct, truncateLabel } from '../formatters';
import type { GraduacaoData } from '../types';
import { CHART_TOOLTIP, CORES_CATEGORICAS, FMP_DARK, FMP_RED } from '@/lib/chartColors';

const PIE_COLORS = CORES_CATEGORICAS;


type Props = {
  loading: boolean;
  data: GraduacaoData | null;
};

export function GraduacaoTab({ loading, data }: Props) {
  const tooltip = CHART_TOOLTIP;

  if (loading) {
    return (
      <>
        <section className={STAT_GRID_CONTAINER}>
          <div className={STAT_GRID_CLASSES}>
            {Array.from({ length: 7 }).map((_, i) => <StatCardSkeleton key={i} index={i} />)}
          </div>
        </section>
        <div className="h-56 animate-pulse rounded-md border border-line bg-white shadow-card" />
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} height={320} />)}
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
          <StatCard index={2} label="Matrículas efetivas" value={fmtInt(data.matEfet)} icon={GraduationCap} color="fmp" />
          <StatCard index={3} label="Vagas" value={fmtInt(data.vagas)} icon={TrendingUp} color="gray" />
          <StatCard index={4} label="Matrículas canceladas" value={fmtInt(data.matCanc)} icon={TrendingUp} color="gray" />
          <StatCard index={5} label="% Leads → Inscrições" value={fmtPct(data.pctConvIxL)} hint="Inscrições ÷ leads do recorte filtrado: de cada 100 interessados, quantos se inscreveram." icon={TrendingUp} color="gray" />
          <StatCard index={6} label="% Inscrições → Matrículas" value={fmtPct(data.pctConvMxI)} hint="Matrículas efetivas ÷ inscrições: de cada 100 inscritos, quantos se matricularam." icon={TrendingUp} color="gray" />
        </div>
      </section>

      <div className="flex flex-col items-center rounded-md border border-line bg-white p-6 shadow-card animate-fade-in">
        <GaugeSemicircle
          value={data.pctMeta}
          label="Graduação | Meta"
          size={220}
          formatValue={(v) => fmtPct(v)}
          caption={`${fmtInt(data.matEfet)} / ${fmtInt(data.vagas)} vagas`}
        />
      </div>

      <ReorderableGrid storageKey="conv-reorder-graduacao" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RItem rid="pgt-bolsas">
        <SectionCard title="Matrículas Pagantes x Bolsistas" subtitle="Quantas matrículas pagam integral e quantas têm bolsa" icon={GraduationCap}>
          {data.pgtVsBolsas.every((d) => d.valor === 0) ? (
            <EmptyState title="Sem dados para os filtros selecionados" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.pgtVsBolsas} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="barPgtBolsa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="categoria" tick={{ fontSize: 12, fill: '#3A3838' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6E6B66' }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(238,42,66,0.05)' }} contentStyle={tooltip.contentStyle} labelStyle={tooltip.labelStyle} itemStyle={tooltip.itemStyle} formatter={(v: unknown) => [fmtInt(v as number), 'Matrículas']} />
                <Bar dataKey="valor" fill="url(#barPgtBolsa)" radius={[8, 8, 4, 4]} maxBarSize={80} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        </RItem>
        <RItem rid="insc-turno">
        <SectionCard title="Inscrições por Turno" subtitle="Turno de interesse informado na inscrição" icon={Users}>
          {data.inscPorTurno.length === 0 || data.inscPorTurno.every((d) => d.valor === 0) ? (
            <EmptyState title="Sem dados para os filtros selecionados" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Tooltip contentStyle={tooltip.contentStyle} labelStyle={tooltip.labelStyle} itemStyle={tooltip.itemStyle} formatter={(v: unknown) => [fmtInt(v as number), 'Inscrições']} />
                <Pie data={data.inscPorTurno} dataKey="valor" nameKey="categoria" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} stroke="none" label={(entry: unknown) => { const e = entry as { categoria?: string; valor?: number }; return `${e.categoria ?? ''}: ${fmtInt(e.valor ?? 0)}`; }} labelLine={false}>
                  {data.inscPorTurno.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        </RItem>
        <RItem rid="insc-processo">
        <SectionCard title="Inscrições por Processo Seletivo" subtitle="Volume de inscrições por vestibular/edital" icon={Users}>
          {data.inscPorProcesso.length === 0 ? (
            <EmptyState title="Sem dados para os filtros selecionados" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, data.inscPorProcesso.length * 28)}>
              <BarChart data={data.inscPorProcesso} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="barProcGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6E6B66' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => fmtInt(v)} />
                <YAxis type="category" dataKey="categoria" tick={{ fontSize: 10, fill: '#3A3838' }} tickLine={false} axisLine={false} width={180} tickFormatter={(v: string) => truncateLabel(v, 26)} />
                <Tooltip cursor={{ fill: 'rgba(238,42,66,0.05)' }} contentStyle={tooltip.contentStyle} labelStyle={tooltip.labelStyle} itemStyle={tooltip.itemStyle} formatter={(v: unknown) => [`${fmtInt(v as number)} inscrições`, 'Processo']} />
                <Bar dataKey="valor" fill="url(#barProcGrad)" radius={[4, 8, 8, 4]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        </RItem>
        <RItem rid="mat-ingresso">
        <SectionCard title="Matrículas por Tipo de Ingresso" subtitle="Como o aluno entrou: vestibular, transferência, ENEM…" icon={GraduationCap}>
          {data.matPorTipoIngresso.length === 0 ? (
            <EmptyState title="Sem dados para os filtros selecionados" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, data.matPorTipoIngresso.length * 28)}>
              <BarChart data={data.matPorTipoIngresso} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="barIngresso" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6E6B66' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => fmtInt(v)} />
                <YAxis type="category" dataKey="categoria" tick={{ fontSize: 10, fill: '#3A3838' }} tickLine={false} axisLine={false} width={180} tickFormatter={(v: string) => truncateLabel(v, 26)} />
                <Tooltip cursor={{ fill: 'rgba(238,42,66,0.05)' }} contentStyle={tooltip.contentStyle} labelStyle={tooltip.labelStyle} itemStyle={tooltip.itemStyle} formatter={(v: unknown) => [`${fmtInt(v as number)} matrículas`, 'Ingresso']} />
                <Bar dataKey="valor" fill="url(#barIngresso)" radius={[4, 8, 8, 4]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
        </RItem>

        <RItem rid="mat-dia" className="lg:col-span-2">
      <SectionCard title="Matrículas por Dia" subtitle="Ritmo diário de efetivação de matrículas" icon={TrendingUp}>
        {data.matPorDia.length === 0 ? (
          <EmptyState title="Sem dados para os filtros selecionados" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.matPorDia} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="barDia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
                </linearGradient>
              </defs>
              <XAxis dataKey="data" tick={{ fontSize: 9, fill: '#6E6B66' }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(8) + '/' + v.slice(5, 7)} interval={Math.max(0, Math.floor(data.matPorDia.length / 12))} />
              <YAxis tick={{ fontSize: 11, fill: '#6E6B66' }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(238,42,66,0.05)' }} contentStyle={tooltip.contentStyle} labelStyle={tooltip.labelStyle} itemStyle={tooltip.itemStyle} formatter={(v: unknown) => [`${fmtInt(v as number)} matrículas`, 'Dia']} />
              <Bar dataKey="valor" fill="url(#barDia)" radius={[4, 4, 2, 2]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>
        </RItem>
      </ReorderableGrid>
    </>
  );
}
