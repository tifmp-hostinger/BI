import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, HelpCircle, Minus } from 'lucide-react';

type Trend = { value: number; direction: 'up' | 'down' | 'flat' };
type ColorKey = 'fmp' | 'success' | 'warning' | 'danger' | 'info' | 'gray';

type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: Trend;
  color?: ColorKey;
  highlight?: boolean;
  index?: number;
  /** Explicação da métrica: vira um "?" discreto ao lado do rótulo. */
  hint?: string;
  /** Valor por extenso no hover, quando `value` está abreviado (ex. "R$ 872 mil"). */
  exactValue?: string;
};

const COLOR_STYLES: Record<
  ColorKey,
  { icon: string; bg: string; bar: string; text: string }
> = {
  fmp: { icon: 'text-fmp', bg: 'bg-fmp-muted', bar: 'bg-fmp', text: 'text-fmp' },
  success: { icon: 'text-success', bg: 'bg-success-light', bar: 'bg-success', text: 'text-success-dark' },
  warning: { icon: 'text-warning', bg: 'bg-warning-light', bar: 'bg-warning', text: 'text-warning-dark' },
  danger: { icon: 'text-danger', bg: 'bg-danger-light', bar: 'bg-danger', text: 'text-danger-dark' },
  info: { icon: 'text-info', bg: 'bg-info-light', bar: 'bg-info', text: 'text-info-dark' },
  gray: { icon: 'text-ink-3', bg: 'bg-paper', bar: 'bg-sand', text: 'text-ink-2' },
};

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'fmp',
  highlight = false,
  index = 0,
  hint,
  exactValue,
}: StatCardProps) {
  const styles = COLOR_STYLES[color];
  const TrendIcon =
    trend?.direction === 'up' ? ArrowUpRight : trend?.direction === 'down' ? ArrowDownRight : Minus;
  const trendColor =
    trend?.direction === 'up' ? 'text-success' : trend?.direction === 'down' ? 'text-danger' : 'text-ink-3';

  return (
    <div
      className={`relative overflow-hidden rounded-md border border-line bg-white p-5 shadow-card transition-all duration-200 hover:shadow-card-hover animate-slide-up ${
        highlight ? 'ring-1 ring-fmp/30' : ''
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-2xs font-semibold uppercase tracking-widest text-ink-3">
            {label}
            {hint && (
              <span
                tabIndex={0}
                role="note"
                aria-label={hint}
                title={hint}
                className="cursor-help rounded-full text-ink-3/70 transition hover:text-fmp focus:text-fmp focus:outline-none"
              >
                <HelpCircle className="h-3 w-3" strokeWidth={2.4} />
              </span>
            )}
          </p>
          <p
            className="mt-2 text-3xl text-ink"
            style={{ fontFamily: '"Noto Serif", serif', fontStyle: 'italic', fontWeight: 600, lineHeight: 1 }}
            title={exactValue}
          >
            {value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-ink-3 line-clamp-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`rounded-sm p-2.5 ${styles.bg}`}>
            <Icon className={`h-5 w-5 ${styles.icon}`} strokeWidth={2.2} />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <span className={`flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-2xs font-semibold ${trendColor}`}>
            <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
            {trend.value > 0 ? '+' : ''}
            {trend.value}%
          </span>
          <span className="text-2xs text-ink-3">vs. periodo anterior</span>
        </div>
      )}
    </div>
  );
}

export function StatCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="rounded-md border border-line bg-white p-5 shadow-card animate-pulse"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-24 rounded bg-line" />
          <div className="mt-3 h-8 w-20 rounded bg-line" />
          <div className="mt-2 h-3 w-32 rounded bg-paper" />
        </div>
        <div className="h-10 w-10 rounded-sm bg-paper" />
      </div>
      <div className="mt-4 h-4 w-28 rounded-full bg-paper" />
    </div>
  );
}
