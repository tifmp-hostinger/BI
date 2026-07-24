import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: 'neutral' | 'accent' | 'success' | 'warning';
};

const TONE: Record<NonNullable<Props['tone']>, { chip: string; text: string }> = {
  neutral: { chip: 'bg-gray-100 text-gray-500', text: 'text-gray-900' },
  accent: { chip: 'bg-fmp-muted text-fmp-dark', text: 'text-fmp-dark' },
  success: { chip: 'bg-success-light text-success-dark', text: 'text-success-dark' },
  warning: { chip: 'bg-warning-light text-warning-dark', text: 'text-warning-dark' },
};

export function KpiRow({ label, value, hint, icon: Icon, tone = 'neutral' }: Props) {
  const t = TONE[tone];
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-2.5 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && (
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${t.chip}`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-2xs font-medium uppercase tracking-wider text-gray-500 line-clamp-1">
            {label}
          </p>
          {hint && <p className="text-2xs text-gray-400 line-clamp-1">{hint}</p>}
        </div>
      </div>
      <span className={`text-base font-semibold tabular-nums ${t.text}`}>
        {value}
      </span>
    </div>
  );
}
