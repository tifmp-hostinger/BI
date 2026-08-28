import { ArrowLeft, HelpCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AtualizandoAviso } from '@/components/ui/AtualizandoAviso';
import { BalaoInfo } from '@/components/ui/BalaoInfo';
import { DataFreshness } from '@/components/ui/DataFreshness';
import { SeletorVisualizacao } from '@/components/ui/SeletorVisualizacao';
import type { RitmoFonte } from '@/lib/dataFreshness';

/**
 * Faixa de contexto do painel — substitui o "hero" escuro.
 *
 * Motivo: o hero ocupava 263-286px do topo de cada painel para repetir o
 * título que já está na barra superior e exibir um parágrafo institucional
 * lido uma vez. Medido no app, o primeiro NÚMERO só aparecia entre 67% e 83%
 * da primeira tela (109% no tablet, ou seja, abaixo da dobra). O painel de
 * Growth, único sem hero, mostrava três vezes mais dado na mesma área.
 *
 * Aqui fica só o que é usado toda vez: voltar, saber de quando é o dado e
 * atualizar. A descrição do painel continua acessível, atrás do "?".
 */
export function BarraContexto({
  descricao,
  tabelas,
  ritmos,
  revalidando,
  onAtualizar,
}: {
  /** Texto institucional do painel — vai para o balão do "?". */
  descricao: string;
  tabelas: string[];
  ritmos?: Record<string, RitmoFonte>;
  revalidando: boolean;
  onAtualizar: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-line bg-card px-4 py-2.5 shadow-card animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-widest text-ink-3 transition hover:text-fmp no-underline"
      >
        <ArrowLeft className="h-3 w-3" />
        Central
      </Link>

      <span className="hidden h-4 w-px bg-line sm:block" />

      <DataFreshness tabelas={tabelas} ritmos={ritmos} />
      <AtualizandoAviso visivel={revalidando} />

      <BalaoInfo
        rotuloAcao="O que este painel mostra"
        gatilho={<HelpCircle className="h-3.5 w-3.5" strokeWidth={2.2} />}
      >
        <span className="block text-2xs leading-relaxed text-ink-2">{descricao}</span>
      </BalaoInfo>

      {/* Preferência GLOBAL (vale para todos os painéis de uma vez) — mora
          aqui porque é onde os gráficos estão; ver lib/estiloVisualizacao. */}
      <div className="ml-auto flex items-center gap-2">
        <SeletorVisualizacao />
        <button
          type="button"
          onClick={onAtualizar}
          className="inline-flex items-center gap-1.5 rounded-pill bg-fmp px-3.5 py-1.5 text-2xs font-medium text-white transition hover:bg-fmp-dark"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${revalidando ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>
    </div>
  );
}
