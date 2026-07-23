export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-xl bg-gradient-to-b from-gray-100 to-gray-50"
      style={{ height }}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 animate-pulse"
        >
          <div className="h-9 w-9 rounded-lg bg-gray-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 rounded bg-gray-200" />
            <div className="h-2.5 w-1/2 rounded bg-gray-100" />
          </div>
          <div className="h-4 w-12 rounded-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-fmp-muted border-t-fmp" />
        <p className="text-xs text-gray-500">Carregando...</p>
      </div>
    </div>
  );
}
