import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

type Props = {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon = Inbox, title, message, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center animate-fade-in">
      <div className="rounded-full bg-white p-3 shadow-card">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-800">{title}</h3>
      {message && <p className="mt-1 max-w-md text-xs text-gray-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
