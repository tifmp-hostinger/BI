export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-md bg-paper"
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
          className="flex items-center gap-3 rounded-md border border-line bg-white p-3 animate-pulse"
        >
          <div className="h-9 w-9 rounded-sm bg-line" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 rounded bg-line" />
            <div className="h-2.5 w-1/2 rounded bg-paper" />
          </div>
          <div className="h-4 w-12 rounded-full bg-line" />
        </div>
      ))}
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-fmp" />
        <p className="text-xs text-ink-3">Carregando...</p>
      </div>
    </div>
  );
}
