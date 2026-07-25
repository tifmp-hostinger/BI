import type { ConversaoFilters, FilterOptions } from '../types';
import { ANOS } from '../constants';

type Props = {
  options: FilterOptions;
  filters: ConversaoFilters;
  onCodperletChange: (v: string[]) => void;
  onAnoChange: (v: number[]) => void;
  onMesChange: (v: number[]) => void;
  onDataInicioChange: (v: string | null) => void;
  onDataFimChange: (v: string | null) => void;
};

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export function ConversaoFilterBar({
  options,
  filters,
  onCodperletChange,
  onAnoChange,
  onMesChange,
  onDataInicioChange,
  onDataFimChange,
}: Props) {
  return (
    <div className="rounded-md border border-line bg-white p-4 shadow-card animate-fade-in">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="filtro-codperlet"
            className="text-2xs font-semibold uppercase tracking-widest text-ink-3"
          >
            Periodo Letivo
          </label>
          <select
            id="filtro-codperlet"
            className="rounded-sm border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-fmp focus:outline-none"
            value={filters.codperlet[0] ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              onCodperletChange(v ? [v] : []);
            }}
          >
            <option value="">Todos</option>
            {options.codperletOptions.map((cp) => (
              <option key={cp} value={cp}>
                {cp}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-2xs font-semibold uppercase tracking-widest text-ink-3">
            Ano
          </span>
          <div className="flex items-center gap-1" role="group" aria-label="Filtro de ano">
            {ANOS.map((ano) => (
              <button
                key={ano}
                type="button"
                aria-pressed={filters.ano.includes(ano)}
                onClick={() => onAnoChange(toggle(filters.ano, ano))}
                className={`rounded-pill px-3 py-1.5 text-2xs font-semibold transition ${
                  filters.ano.includes(ano)
                    ? 'bg-fmp text-white'
                    : 'bg-paper text-ink-2 hover:bg-line'
                }`}
              >
                {ano}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="filtro-mes"
            className="text-2xs font-semibold uppercase tracking-widest text-ink-3"
          >
            Mes
          </label>
          <select
            id="filtro-mes"
            className="rounded-sm border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-fmp focus:outline-none"
            value={filters.mes[0] ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              onMesChange(v ? [Number(v)] : []);
            }}
          >
            <option value="">Todos</option>
            {options.mesOptions.map((m) => (
              <option key={m.numero} value={m.numero}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="filtro-data-inicio"
            className="text-2xs font-semibold uppercase tracking-widest text-ink-3"
          >
            Data Inicio
          </label>
          <input
            id="filtro-data-inicio"
            type="date"
            className="rounded-sm border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-fmp focus:outline-none"
            value={filters.dataInicio ?? ''}
            onChange={(e) => onDataInicioChange(e.target.value || null)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="filtro-data-fim"
            className="text-2xs font-semibold uppercase tracking-widest text-ink-3"
          >
            Data Fim
          </label>
          <input
            id="filtro-data-fim"
            type="date"
            className="rounded-sm border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-fmp focus:outline-none"
            value={filters.dataFim ?? ''}
            onChange={(e) => onDataFimChange(e.target.value || null)}
          />
        </div>

        {(filters.codperlet.length > 0 ||
          filters.ano.length > 0 ||
          filters.mes.length > 0 ||
          filters.dataInicio ||
          filters.dataFim) && (
          <button
            type="button"
            onClick={() => {
              onCodperletChange([]);
              onAnoChange([]);
              onMesChange([]);
              onDataInicioChange(null);
              onDataFimChange(null);
            }}
            className="mt-5 rounded-pill bg-paper px-3 py-2 text-2xs font-semibold text-ink-2 transition hover:bg-line"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
