import type { FilterOptions } from '../types';

type Props = {
  options: FilterOptions | null;
  codperlet: string | null;
  ano: number | null;
  tipocurso: string | null;
  bolsaPadronizada: string | null;
  onCodperletChange: (v: string | null) => void;
  onAnoChange: (v: number | null) => void;
  onTipocursoChange: (v: string | null) => void;
  onBolsaPadronizadaChange: (v: string | null) => void;
};

const selectClass =
  'rounded-md border border-line-2 bg-white px-3 py-1.5 text-2xs font-semibold text-ink-2 transition focus:border-fmp focus:outline-none focus:ring-1 focus:ring-fmp/30 cursor-pointer';

export function BolsasFilterBar({
  options,
  codperlet,
  ano,
  tipocurso,
  bolsaPadronizada,
  onCodperletChange,
  onAnoChange,
  onTipocursoChange,
  onBolsaPadronizadaChange,
}: Props) {
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-white p-4 shadow-card animate-fade-in">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-2xs font-semibold uppercase tracking-widest text-ink-3">
          Período
        </label>
        <select
          value={codperlet ?? ''}
          onChange={(e) => onCodperletChange(e.target.value || null)}
          className={selectClass}
        >
          <option value="">Todos</option>
          {(options?.codperletOptions ?? []).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-2xs font-semibold uppercase tracking-widest text-ink-3">
          Ano
        </label>
        <select
          value={ano ?? ''}
          onChange={(e) => onAnoChange(e.target.value ? Number(e.target.value) : null)}
          className={selectClass}
        >
          <option value="">Todos</option>
          {(options?.anoOptions ?? []).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-2xs font-semibold uppercase tracking-widest text-ink-3">
          Nível
        </label>
        <select
          value={tipocurso ?? ''}
          onChange={(e) => onTipocursoChange(e.target.value || null)}
          className={selectClass}
        >
          <option value="">Todos</option>
          {(options?.tipocursoOptions ?? []).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-2xs font-semibold uppercase tracking-widest text-ink-3">
          Benefício
        </label>
        <select
          value={bolsaPadronizada ?? ''}
          onChange={(e) => onBolsaPadronizadaChange(e.target.value || null)}
          className={`${selectClass} max-w-[220px]`}
        >
          <option value="">Todos</option>
          {(options?.bolsaPadronizadaOptions ?? []).map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {(codperlet || ano || tipocurso || bolsaPadronizada) && (
        <button
          type="button"
          onClick={() => {
            onCodperletChange(null);
            onAnoChange(null);
            onTipocursoChange(null);
            onBolsaPadronizadaChange(null);
          }}
          className="ml-auto inline-flex items-center gap-1 rounded-pill bg-paper px-3 py-1.5 text-2xs font-semibold text-ink-2 transition hover:bg-sand/30"
        >
          Limpar filtros
        </button>
      )}
    </section>
  );
}
