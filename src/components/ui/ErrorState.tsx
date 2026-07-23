import { AlertTriangle, RefreshCw } from 'lucide-react';

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Nao foi possivel carregar',
  message = 'Ocorreu um problema ao buscar os dados. Tente novamente em instantes.',
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-danger/30 bg-danger-light/40 p-8 text-center animate-fade-in">
      <div className="rounded-full bg-white p-3 shadow-card">
        <AlertTriangle className="h-6 w-6 text-danger" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-danger-dark">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-gray-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 shadow-card transition-all hover:shadow-card-hover"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
