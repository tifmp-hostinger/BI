import { MultiSelect } from '@/components/ui/MultiSelect';
import type { FilterOptions } from '../types';

type Props = {
  options: FilterOptions | null;
  codperlet: string[];
  ano: number[];
  tipocurso: string[];
  bolsaPadronizada: string[];
  onCodperletChange: (v: string[]) => void;
  onAnoChange: (v: number[]) => void;
  onTipocursoChange: (v: string[]) => void;
  onBolsaPadronizadaChange: (v: string[]) => void;
};

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
  const hasFilters =
    codperlet.length > 0 ||
    ano.length > 0 ||
    tipocurso.length > 0 ||
    bolsaPadronizada.length > 0;

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-white p-4 shadow-card animate-fade-in">
      <MultiSelect
        label="Período"
        options={options?.codperletOptions ?? []}
        selected={codperlet}
        onChange={(v) => onCodperletChange(v.filter((x): x is string => typeof x === 'string'))}
      />
      <MultiSelect
        label="Ano"
        options={options?.anoOptions ?? []}
        selected={ano}
        onChange={(v) => onAnoChange(v.filter((x): x is number => typeof x === 'number'))}
      />
      <MultiSelect
        label="Nível"
        options={options?.tipocursoOptions ?? []}
        selected={tipocurso}
        onChange={(v) => onTipocursoChange(v.filter((x): x is string => typeof x === 'string'))}
      />
      <MultiSelect
        label="Benefício"
        options={options?.bolsaPadronizadaOptions ?? []}
        selected={bolsaPadronizada}
        onChange={(v) => onBolsaPadronizadaChange(v.filter((x): x is string => typeof x === 'string'))}
        widthClass="min-w-[220px]"
      />

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            onCodperletChange([]);
            onAnoChange([]);
            onTipocursoChange([]);
            onBolsaPadronizadaChange([]);
          }}
          className="ml-auto inline-flex items-center gap-1 rounded-pill bg-paper px-3 py-1.5 text-2xs font-semibold text-ink-2 transition hover:bg-sand/30"
        >
          Limpar filtros
        </button>
      )}
    </section>
  );
}
