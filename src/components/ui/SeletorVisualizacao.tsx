import { Sparkles, History } from 'lucide-react';
import {
  defineEstiloVisualizacao,
  useEstiloVisualizacao,
} from '@/lib/estiloVisualizacao';

/**
 * Alterna entre os gráficos revisados ('nova') e as formas herdadas do
 * Power BI ('classica') — ver lib/estiloVisualizacao.ts para o porquê.
 * Controle compacto de dois segmentos, no mesmo vocabulário das abas-pílula.
 */
export function SeletorVisualizacao() {
  const estilo = useEstiloVisualizacao();

  const base =
    'inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-2xs font-semibold transition';
  const ativo = 'bg-fmp text-white shadow-glow';
  const inativo = 'text-ink-3 hover:bg-paper hover:text-ink-2';

  return (
    <div
      role="group"
      aria-label="Estilo dos gráficos"
      title="Alguns gráficos foram redesenhados. Os números são os mesmos nas duas versões — muda só a forma de apresentar."
      className="inline-flex items-center gap-0.5 rounded-pill border border-line bg-card p-0.5"
    >
      <button
        type="button"
        aria-pressed={estilo === 'nova'}
        onClick={() => defineEstiloVisualizacao('nova')}
        className={`${base} ${estilo === 'nova' ? ativo : inativo}`}
      >
        <Sparkles className="h-3 w-3" />
        Novo
      </button>
      <button
        type="button"
        aria-pressed={estilo === 'classica'}
        onClick={() => defineEstiloVisualizacao('classica')}
        className={`${base} ${estilo === 'classica' ? ativo : inativo}`}
      >
        <History className="h-3 w-3" />
        Clássico
      </button>
    </div>
  );
}
