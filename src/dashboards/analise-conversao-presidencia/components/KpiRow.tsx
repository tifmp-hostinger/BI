import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: 'neutral' | 'accent' | 'success' | 'warning';
  /** Valor por extenso no hover, quando `value` está abreviado. */
  exact?: string;
  /**
   * Variação vs. o período de comparação (fração: 0.12 = +12%). Vira um chip
   * ▲/▼ ao lado do valor — a comparação que antes o usuário fazia de cabeça
   * entre os dois cards de Graduação.
   */
  delta?: number | null;
};

const TONE: Record<NonNullable<Props['tone']>, { chip: string; text: string }> = {
  neutral: { chip: 'bg-paper text-ink-3', text: 'text-ink' },
  accent: { chip: 'bg-fmp-muted text-fmp', text: 'text-ink' },
  success: { chip: 'bg-success-light text-success-dark', text: 'text-ink' },
  warning: { chip: 'bg-warning-light text-warning-dark', text: 'text-ink' },
};

export function KpiRow({ label, value, hint, icon: Icon, tone = 'neutral', exact, delta }: Props) {
  const t = TONE[tone];
  const deltaPct = delta === null || delta === undefined ? null : Math.round(delta * 100);
  const DeltaIcon = deltaPct !== null && deltaPct < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && (
          <span
            className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm ${t.chip}`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-3 line-clamp-1">
            {label}
          </p>
          {hint && <p className="text-2xs text-ink-3 line-clamp-2">{hint}</p>}
        </div>
      </div>
      <span className="flex min-w-0 flex-shrink-0 items-center gap-1.5">
        {deltaPct !== null && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-2xs font-semibold ${
              deltaPct >= 0 ? 'bg-success-light text-success-dark' : 'bg-danger-light text-danger-dark'
            }`}
            title="Variação em relação ao período anterior"
          >
            <DeltaIcon className="h-2.5 w-2.5" strokeWidth={2.5} />
            {deltaPct > 0 ? '+' : ''}
            {deltaPct}%
          </span>
        )}
        <span className="fmp-kpi text-base leading-normal tabular-nums" title={exact}>
          {value}
        </span>
      </span>
    </div>
  );
}
