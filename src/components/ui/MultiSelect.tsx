import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

type Props = {
  label: string;
  options: (string | number)[];
  selected: (string | number)[];
  onChange: (next: (string | number)[]) => void;
  widthClass?: string;
};

const btnClass =
  'inline-flex items-center justify-between gap-1.5 rounded-md border border-line-2 bg-white px-3 py-1.5 text-2xs font-semibold text-ink-2 transition hover:border-fmp/50 focus:border-fmp focus:outline-none focus:ring-1 focus:ring-fmp/30 cursor-pointer';

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  widthClass = 'min-w-[160px]',
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const allSelected = selected.length === 0;
  const toggle = (val: string | number) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const displayText = allSelected
    ? 'Todos'
    : selected.length === 1
      ? String(selected[0])
      : `${selected.length} selecionados`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-2xs font-semibold uppercase tracking-widest text-ink-3">
        {label}
      </label>
      <div ref={ref} className={`relative ${widthClass}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`${btnClass} w-full`}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="h-3 w-3 flex-shrink-0 text-ink-3" />
        </button>
        {open && (
          <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-line bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => onChange([])}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-2xs font-semibold transition hover:bg-paper ${
                allSelected ? 'text-fmp' : 'text-ink-2'
              }`}
            >
              <span className="h-3.5 w-3.5 flex-shrink-0" />
              Todos
            </button>
            {options.map((opt) => {
              const isSel = selected.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggle(opt)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-2xs font-semibold transition hover:bg-paper ${
                    isSel ? 'text-fmp' : 'text-ink-2'
                  }`}
                >
                  <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
                    {isSel && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
