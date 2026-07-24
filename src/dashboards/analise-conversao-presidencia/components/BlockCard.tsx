import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: 'fmp' | 'info' | 'success' | 'warning';
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

const ACCENT_MAP: Record<
  NonNullable<Props['accent']>,
  { bar: string; badgeBg: string; badgeText: string; iconBg: string; iconText: string }
> = {
  fmp: {
    bar: 'from-fmp-light to-fmp',
    badgeBg: 'bg-fmp-muted',
    badgeText: 'text-fmp-dark',
    iconBg: 'bg-fmp-muted',
    iconText: 'text-fmp',
  },
  info: {
    bar: 'from-info to-info-dark',
    badgeBg: 'bg-info-light',
    badgeText: 'text-info-dark',
    iconBg: 'bg-info-light',
    iconText: 'text-info-dark',
  },
  success: {
    bar: 'from-success to-success-dark',
    badgeBg: 'bg-success-light',
    badgeText: 'text-success-dark',
    iconBg: 'bg-success-light',
    iconText: 'text-success-dark',
  },
  warning: {
    bar: 'from-warning to-warning-dark',
    badgeBg: 'bg-warning-light',
    badgeText: 'text-warning-dark',
    iconBg: 'bg-warning-light',
    iconText: 'text-warning-dark',
  },
};

export function BlockCard({
  title,
  subtitle,
  icon: Icon,
  accent = 'fmp',
  actions,
  children,
  footer,
  className = '',
}: Props) {
  const styles = ACCENT_MAP[accent];
  return (
    <section
      className={`relative overflow-hidden rounded-2xl bg-white shadow-card animate-fade-in ${className}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.bar}`} />
      <header className="flex flex-wrap items-start justify-between gap-4 px-5 pb-3 pt-5">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className={`rounded-xl p-2.5 ${styles.iconBg}`}>
              <Icon className={`h-5 w-5 ${styles.iconText}`} strokeWidth={2.2} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </header>
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <footer
          className={`border-t border-gray-100 px-5 py-3 text-2xs font-medium ${styles.badgeText}`}
        >
          {footer}
        </footer>
      )}
    </section>
  );
}
