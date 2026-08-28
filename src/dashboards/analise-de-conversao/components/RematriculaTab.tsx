import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingDown, RefreshCw, RotateCcw } from 'lucide-react';
import { SectionCard } from '@/components/ui/SectionCard';
import { ReorderableGrid, RItem } from '@/components/ui/ReorderableGrid';
import { ChartSkeleton } from '@/components/ui/Skeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import type { RematriculaData } from '../types';
import { CHART_TOOLTIP, CORES_CATEGORICAS, FMP_DARK, FMP_RED, NEUTRAL } from '@/lib/chartColors';
import { useEstiloVisualizacao } from '@/lib/estiloVisualizacao';

/**
 * Barras agrupadas num único eixo (estilo 'nova') para Reingresso e
 * Rematrícula. As duas séries são CONTAGENS de matrículas — o desenho antigo
 * as punha em dois eixos Y, então a distância vertical entre barra e linha não
 * significava nada, mas parecia significar. Mesma unidade = mesmo eixo.
 */
function BarrasAgrupadas({
  dados,
  chaveA,
  rotuloA,
  chaveB,
  rotuloB,
  gradientId,
}: {
  dados: Array<Record<string, string | number>>;
  chaveA: string;
  rotuloA: string;
  chaveB: string;
  rotuloB: string;
  gradientId: string;
}) {
  const tooltip = CHART_TOOLTIP;
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={dados} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
            <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#2B2830" />
        <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#9B97A1' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9B97A1' }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'rgba(255,77,99,0.10)' }} contentStyle={tooltip.contentStyle} labelStyle={tooltip.labelStyle} itemStyle={tooltip.itemStyle} />
        <Legend verticalAlign="bottom" iconType="circle" formatter={(v: string) => <span className="text-xs text-ink-2">{v}</span>} />
        <Bar dataKey={chaveA} name={rotuloA} fill={`url(#${gradientId})`} radius={[8, 8, 4, 4]} maxBarSize={36} />
        <Bar dataKey={chaveB} name={rotuloB} fill={NEUTRAL} radius={[8, 8, 4, 4]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

type Props = {
  loading: boolean;
  data: RematriculaData | null;
};

export function RematriculaTab({ loading, data }: Props) {
  const tooltip = CHART_TOOLTIP;
  const estilo = useEstiloVisualizacao();

  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => <ChartSkeleton key={i} height={360} />)}
      </section>
    );
  }

  if (!data) return null;

  const evasaoEmpty = data.evasaoPorPeriodo.every(
    (d) => d.evJubilado === 0 && d.evEvadido === 0 && d.evCancelado === 0 && d.evTransferido === 0,
  );
  const reingressoEmpty = data.reingressoPorPeriodo.every(
    (d) => d.reingressoConf === 0 && d.reingressoAguard === 0,
  );
  const rematEmpty = data.rematriculaPorPeriodo.every(
    (d) => d.rematConf === 0 && d.rematNaoRealiz === 0,
  );

  return (
    <>
      <ReorderableGrid storageKey="conv-reorder-rematricula" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RItem rid="evasao">
        <SectionCard
          title="Rematrícula - Composição (Evasão)"
          subtitle="Motivos de saída, empilhados por período letivo"
          icon={TrendingDown}
        >
          {evasaoEmpty ? (
            <EmptyState title="Sem dados de evasão para os filtros selecionados" />
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={data.evasaoPorPeriodo} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="#2B2830" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#9B97A1' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9B97A1' }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,77,99,0.10)' }} contentStyle={tooltip.contentStyle} labelStyle={tooltip.labelStyle} itemStyle={tooltip.itemStyle} />
                <Legend verticalAlign="bottom" iconType="circle" formatter={(v: string) => { const labels: Record<string, string> = { evJubilado: 'Jubilado', evEvadido: 'Evadido', evCancelado: 'Cancelado', evTransferido: 'Transferido' }; return <span className="text-xs text-ink-2">{labels[v] ?? v}</span>; }} />
                <Bar dataKey="evCancelado" name="Cancelado" stackId="a" fill={FMP_RED} radius={[0, 0, 0, 0]} maxBarSize={48} />
                <Bar dataKey="evEvadido" name="Evadido" stackId="a" fill={CORES_CATEGORICAS[1]} radius={[0, 0, 0, 0]} maxBarSize={48} />
                <Bar dataKey="evJubilado" name="Jubilado" stackId="a" fill={CORES_CATEGORICAS[3]} radius={[0, 0, 0, 0]} maxBarSize={48} />
                <Bar dataKey="evTransferido" name="Transferido" stackId="a" fill={CORES_CATEGORICAS[0]} radius={[8, 8, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        </RItem>
        <RItem rid="reingresso">
        <SectionCard
          title="Reingresso - Comportamento"
          subtitle={estilo === 'nova' ? 'Confirmadas x aguardando, por período letivo' : 'Colunas: Confirmadas | Linha: Aguardando'}
          icon={RefreshCw}
        >
          {reingressoEmpty ? (
            <EmptyState title="Sem dados de reingresso para os filtros selecionados" />
          ) : estilo === 'nova' ? (
            <BarrasAgrupadas
              dados={data.reingressoPorPeriodo as unknown as Array<Record<string, string | number>>}
              chaveA="reingressoConf"
              rotuloA="Confirmadas"
              chaveB="reingressoAguard"
              rotuloB="Aguardando"
              gradientId="barReingressoNovo"
            />
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={data.reingressoPorPeriodo} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="barReingresso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#2B2830" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#9B97A1' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9B97A1' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9B97A1' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltip.contentStyle} labelStyle={tooltip.labelStyle} itemStyle={tooltip.itemStyle} />
                <Legend verticalAlign="bottom" iconType="circle" formatter={(v: string) => { const labels: Record<string, string> = { reingressoConf: 'Confirmadas', reingressoAguard: 'Aguardando' }; return <span className="text-xs text-ink-2">{labels[v] ?? v}</span>; }} />
                <Bar yAxisId="left" dataKey="reingressoConf" name="Confirmadas" fill="url(#barReingresso)" radius={[8, 8, 4, 4]} maxBarSize={48} />
                <Line yAxisId="right" type="monotone" dataKey="reingressoAguard" name="Aguardando" stroke={NEUTRAL} strokeWidth={2.5} dot={{ r: 4, fill: NEUTRAL }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        </RItem>
        <RItem rid="rematricula">
        <SectionCard
          title="Rematrícula - Composição"
          subtitle={estilo === 'nova' ? 'Confirmadas x não realizadas, por período letivo' : 'Colunas: confirmadas | Linha: não realizadas'}
          icon={RotateCcw}
        >
          {rematEmpty ? (
            <EmptyState title="Sem dados de rematrícula para os filtros selecionados" />
          ) : estilo === 'nova' ? (
            <BarrasAgrupadas
              dados={data.rematriculaPorPeriodo as unknown as Array<Record<string, string | number>>}
              chaveA="rematConf"
              rotuloA="Confirmada"
              chaveB="rematNaoRealiz"
              rotuloB="Não realizada"
              gradientId="barRematNovo"
            />
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={data.rematriculaPorPeriodo} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="barRemat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#2B2830" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#9B97A1' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9B97A1' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9B97A1' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltip.contentStyle} labelStyle={tooltip.labelStyle} itemStyle={tooltip.itemStyle} />
                <Legend verticalAlign="bottom" iconType="circle" formatter={(v: string) => { const labels: Record<string, string> = { rematConf: 'Confirmada', rematNaoRealiz: 'Não realizada' }; return <span className="text-xs text-ink-2">{labels[v] ?? v}</span>; }} />
                <Bar yAxisId="left" dataKey="rematConf" name="Confirmada" fill="url(#barRemat)" radius={[8, 8, 4, 4]} maxBarSize={48} />
                <Line yAxisId="right" type="monotone" dataKey="rematNaoRealiz" name="Não realizada" stroke={NEUTRAL} strokeWidth={2.5} dot={{ r: 4, fill: NEUTRAL }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
        </RItem>
      </ReorderableGrid>
    </>
  );
}
