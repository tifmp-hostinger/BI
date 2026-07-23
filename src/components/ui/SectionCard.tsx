import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = '',
  contentClassName = '',
}: Props) {
  return (
    <section className={`rounded-2xl bg-white shadow-card animate-fade-in ${className}`}>
      <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className="rounded-lg bg-fmp-muted p-2 text-fmp">
              <Icon className="h-4 w-4" strokeWidth={2.4} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </header>
      <div className={`p-5 ${contentClassName}`}>{children}</div>
    </section>
  );
}
