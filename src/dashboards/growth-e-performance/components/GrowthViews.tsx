import { useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { EmptyState } from '@/components/ui/EmptyState';
import { BrazilStateMap } from '@/components/maps/BrazilStateMap';
import type { StateAgg } from '@/services/matriculasService';
import { fmtBRLCompact, fmtInt, fmtPct, truncateLabel } from '../../analise-de-conversao/formatters';
import type { CampanhaRow, HorarioDatum, MapaUfDatum, SerieMensalDatum } from '../types';

const FMP_RED = '#EE2A42';
const FMP_DARK = '#B81E32';
const NEUTRAL = '#BFBAA4';

const TT = {
  contentStyle: {
    background: 'rgba(255,255,255,0.98)',
    border: '1px solid #DEDCD4',
    borderRadius: 12,
    boxShadow: '0 18px 40px rgba(25,24,24,0.12)',
    padding: 10,
    fontSize: 12,
  } as const,
  labelStyle: { color: '#191818', fontWeight: 600, marginBottom: 4, fontSize: 12 } as const,
  itemStyle: { color: '#3A3838', fontSize: 12 } as const,
};

export function CampanhasView({ rows }: { rows: CampanhaRow[] }) {
  if (rows.length === 0) return <EmptyState title="Sem campanhas para os filtros selecionados" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-line text-left text-2xs font-semibold uppercase tracking-widest text-ink-3">
            <th className="px-3 py-2">Campanha</th>
            <th className="px-3 py-2">Plataforma</th>
            <th className="px-3 py-2 text-right">Leads</th>
            <th className="px-3 py-2 text-right">Investimento</th>
            <th className="px-3 py-2 text-right">Impressões</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.plataforma}-${r.campanha}`} className="border-b border-line/60 text-ink-2 hover:bg-paper">
              <td className="max-w-[340px] truncate px-3 py-2" title={r.campanha}>{r.campanha}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-2xs font-semibold ${
                    r.plataforma === 'Google' ? 'bg-paper text-ink-2' : 'bg-fmp-muted text-fmp'
                  }`}
                >
                  {r.plataforma}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-semibold text-ink">{fmtInt(r.leads)}</td>
              <td className="px-3 py-2 text-right">{fmtBRLCompact(r.investimento)}</td>
              <td className="px-3 py-2 text-right">{fmtInt(r.impressoes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MapaView({ data }: { data: MapaUfDatum[] }) {
  const [selectedUf, setSelectedUf] = useState<string | null>(null);
  if (data.length === 0) return <EmptyState title="Sem dados de estado para os filtros selecionados" />;
  const mapData: StateAgg[] = data.map((d) => ({
    uf: d.uf,
    total: Math.round(d.conversoes),
    pos: 0,
    livres: 0,
    matriculados: 0,
    faturado: d.investimento,
    ticket: 0,
    region: '',
  }));
  return (
    <div>
      {/* HERANÇA §7.10: só Google — Meta não tem dimensão de estado no BI. */}
      <BrazilStateMap data={mapData} selectedUf={selectedUf} onSelect={setSelectedUf} height={420} />
      <p className="mt-2 text-2xs text-ink-3">
        Conversões e investimento por UF — somente Google Ads (o Meta não entra no mapa, como no BI original).
      </p>
    </div>
  );
}

export function HorariosView({ data }: { data: HorarioDatum[] }) {
  if (data.every((d) => d.leads === 0)) {
    return <EmptyState title="Sem leads para os filtros selecionados" />;
  }
  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="barHorario" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FMP_RED} stopOpacity={0.9} />
            <stop offset="100%" stopColor={FMP_DARK} stopOpacity={0.75} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#DEDCD4" />
        <XAxis dataKey="faixa" tick={{ fontSize: 9, fill: '#6E6B66' }} tickLine={false} axisLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6E6B66' }} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: '#6E6B66' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => fmtPct(v)}
        />
        <Tooltip
          contentStyle={TT.contentStyle}
          labelStyle={TT.labelStyle}
          itemStyle={TT.itemStyle}
          formatter={(v: unknown, name: unknown) =>
            name === 'taxaConv' ? [fmtPct(v as number), 'Taxa de Conversão'] : [fmtInt(v as number), 'Leads']
          }
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(v: string) => {
            const labels: Record<string, string> = { leads: 'Quantidade de Leads', taxaConv: 'Taxa de Conversão' };
            return <span className="text-xs text-ink-2">{labels[v] ?? v}</span>;
          }}
        />
        <Bar yAxisId="left" dataKey="leads" fill="url(#barHorario)" radius={[8, 8, 4, 4]} maxBarSize={36} />
        <Line yAxisId="right" type="monotone" dataKey="taxaConv" stroke={NEUTRAL} strokeWidth={2.5} dot={{ r: 3, fill: NEUTRAL }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function SerieMensalView({ data, label }: { data: SerieMensalDatum[]; label: string }) {
  if (data.length === 0 || data.every((d) => d.valor === 0 && d.investimento === 0)) {
    return <EmptyState title="Sem dados para os filtros selecionados" />;
  }
  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#DEDCD4" />
        <XAxis
          dataKey="mesAno"
          tick={{ fontSize: 9, fill: '#6E6B66' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) => truncateLabel(v, 12)}
          interval="preserveStartEnd"
        />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6E6B66' }} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: '#6E6B66' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => fmtBRLCompact(v)}
        />
        <Tooltip
          contentStyle={TT.contentStyle}
          labelStyle={TT.labelStyle}
          itemStyle={TT.itemStyle}
          formatter={(v: unknown, name: unknown) =>
            name === 'investimento' ? [fmtBRLCompact(v as number), 'Investimento'] : [fmtInt(v as number), label]
          }
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(v: string) => {
            const labels: Record<string, string> = { valor: label, investimento: 'Investimento' };
            return <span className="text-xs text-ink-2">{labels[v] ?? v}</span>;
          }}
        />
        <Line yAxisId="left" type="monotone" dataKey="valor" stroke={FMP_RED} strokeWidth={2.5} dot={{ r: 3, fill: FMP_RED }} />
        <Line yAxisId="right" type="monotone" dataKey="investimento" stroke={NEUTRAL} strokeWidth={2.5} dot={{ r: 3, fill: NEUTRAL }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
