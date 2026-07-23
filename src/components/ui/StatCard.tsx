import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

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
};

const COLOR_STYLES: Record<
  ColorKey,
  { icon: string; bg: string; bar: string; text: string }
> = {
  fmp: { icon: 'text-fmp', bg: 'bg-fmp-muted', bar: 'from-fmp-light to-fmp', text: 'text-fmp-dark' },
  success: { icon: 'text-success', bg: 'bg-success-light', bar: 'from-success to-success-dark', text: 'text-success-dark' },
  warning: { icon: 'text-warning', bg: 'bg-warning-light', bar: 'from-warning to-warning-dark', text: 'text-warning-dark' },
  danger: { icon: 'text-danger', bg: 'bg-danger-light', bar: 'from-danger to-danger-dark', text: 'text-danger-dark' },
  info: { icon: 'text-info', bg: 'bg-info-light', bar: 'from-info to-info-dark', text: 'text-info-dark' },
  gray: { icon: 'text-gray-500', bg: 'bg-gray-100', bar: 'from-gray-400 to-gray-600', text: 'text-gray-700' },
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
}: StatCardProps) {
  const styles = COLOR_STYLES[color];
  const TrendIcon =
    trend?.direction === 'up' ? ArrowUpRight : trend?.direction === 'down' ? ArrowDownRight : Minus;
  const trendColor =
    trend?.direction === 'up' ? 'text-success' : trend?.direction === 'down' ? 'text-danger' : 'text-gray-500';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover animate-slide-up ${
        highlight ? 'ring-1 ring-fmp/30' : ''
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500 line-clamp-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`rounded-xl p-2.5 ${styles.bg}`}>
            <Icon className={`h-5 w-5 ${styles.icon}`} strokeWidth={2.2} />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <span className={`flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-2xs font-semibold ${trendColor}`}>
            <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
            {trend.value > 0 ? '+' : ''}
            {trend.value}%
          </span>
          <span className="text-2xs text-gray-500">vs. periodo anterior</span>
        </div>
      )}
    </div>
  );
}

export function StatCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-card animate-pulse"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="mt-3 h-8 w-20 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-32 rounded bg-gray-100" />
        </div>
        <div className="h-10 w-10 rounded-xl bg-gray-100" />
      </div>
      <div className="mt-4 h-4 w-28 rounded-full bg-gray-100" />
    </div>
  );
}
