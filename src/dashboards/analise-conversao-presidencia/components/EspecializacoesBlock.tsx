import { Award, Building2, Globe2, TrendingUp, Wallet } from 'lucide-react';
import { GaugeSemicircle } from '@/components/ui/GaugeSemicircle';
import { BlockCard } from './BlockCard';
import { KpiRow } from './KpiRow';
import { fmtBRL, fmtBRLCompact, fmtPercent } from '../formatters';
import type { EspecializacoesKpis } from '../types';

const MESES = [
  { n: 1, label: 'Jan' },
  { n: 2, label: 'Fev' },
  { n: 3, label: 'Mar' },
  { n: 4, label: 'Abr' },
  { n: 5, label: 'Mai' },
  { n: 6, label: 'Jun' },
  { n: 7, label: 'Jul' },
  { n: 8, label: 'Ago' },
  { n: 9, label: 'Set' },
  { n: 10, label: 'Out' },
  { n: 11, label: 'Nov' },
  { n: 12, label: 'Dez' },
];

type Props = {
  kpis: EspecializacoesKpis | null;
  anos: number[];
  ano: number;
  onAnoChange: (ano: number) => void;
  meses: number[];
  onMesesChange: (meses: number[]) => void;
  loading?: boolean;
};

export function EspecializacoesBlock({
  kpis,
  anos,
  ano,
  onAnoChange,
  meses,
  onMesesChange,
  loading,
}: Props) {
  const toggle = (m: number) => {
    if (meses.includes(m)) onMesesChange(meses.filter((x) => x !== m));
    else onMesesChange([...meses, m].sort((a, b) => a - b));
  };

  return (
    <BlockCard
      title="Especializacoes"
      subtitle="Faturamento realizado x meta"
      icon={Wallet}
      accent="warning"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-2xs font-semibold text-gray-700">
            <span className="text-gray-500">Ano</span>
            <select
              value={ano}
              onChange={(e) => onAnoChange(Number(e.target.value))}
              className="rounded-full bg-transparent text-2xs font-semibold text-warning-dark focus:outline-none"
            >
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>
      }
      footer={
        kpis ? `Meses selecionados: ${kpis.meses.length}/12` : undefined
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {MESES.map((m) => {
          const active = meses.includes(m.n);
          return (
            <button
              key={m.n}
              type="button"
              onClick={() => toggle(m.n)}
              className={`rounded-full px-3 py-1 text-2xs font-semibold transition ${
                active
                  ? 'bg-warning text-white shadow-glow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onMesesChange(MESES.map((m) => m.n))}
          className="ml-1 rounded-full border border-gray-200 px-3 py-1 text-2xs font-semibold text-gray-500 transition hover:border-warning hover:text-warning-dark"
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => onMesesChange([])}
          className="rounded-full border border-gray-200 px-3 py-1 text-2xs font-semibold text-gray-500 transition hover:border-danger hover:text-danger"
        >
          Limpar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 flex items-center justify-center">
          <GaugeSemicircle
            value={loading ? null : kpis?.percentualMeta ?? null}
            label="% Meta"
            caption={
              kpis && kpis.meta !== null
                ? `${fmtBRLCompact(kpis.faturamentoTotal)} / ${fmtBRLCompact(
                    kpis.meta
                  )}`
                : kpis
                ? fmtBRLCompact(kpis.faturamentoTotal)
                : undefined
            }
            colorStart="#FBBF24"
            colorEnd="#B45309"
          />
        </div>
        <div className="lg:col-span-3">
          <KpiRow
            label="Meta"
            value={kpis && kpis.meta !== null ? fmtBRL(kpis.meta) : '—'}
            icon={Award}
            tone="accent"
          />
          <KpiRow
            label="Faturamento Presencial"
            value={kpis ? fmtBRL(kpis.faturamentoPresencial) : '—'}
            icon={Building2}
          />
          <KpiRow
            label="Faturamento EAD"
            value={kpis ? fmtBRL(kpis.faturamentoEad) : '—'}
            icon={Globe2}
          />
          <KpiRow
            label="Faturamento Total"
            value={kpis ? fmtBRL(kpis.faturamentoTotal) : '—'}
            icon={Wallet}
            tone="success"
          />
          <KpiRow
            label="% Meta"
            value={kpis ? fmtPercent(kpis.percentualMeta) : '—'}
            icon={TrendingUp}
            tone={
              kpis && kpis.percentualMeta !== null && kpis.percentualMeta >= 1
                ? 'success'
                : 'warning'
            }
          />
        </div>
      </div>
    </BlockCard>
  );
}
