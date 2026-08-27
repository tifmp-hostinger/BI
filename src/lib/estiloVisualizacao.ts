import { useSyncExternalStore } from 'react';

/**
 * Preferência global de estilo dos gráficos: 'nova' (formas revisadas) ou
 * 'classica' (as formas herdadas do Power BI).
 *
 * Por que existe: a revisão de 2026 trocou a FORMA de alguns gráficos — eixo Y
 * duplo virou painéis empilhados, donuts de ranking viraram barras — sem tocar
 * em nenhum cálculo. Como a filosofia do projeto é paridade verificável com o
 * BI antigo, o modo clássico fica disponível como prova: alternando, o usuário
 * confere que os números são os mesmos e só o desenho mudou. Quando a
 * confiança estiver estabelecida, este módulo e os ramos 'classica' podem ser
 * removidos.
 *
 * Implementação: estado de módulo + useSyncExternalStore, para que TODOS os
 * gráficos montados re-renderizem juntos ao alternar — um contexto exigiria
 * envolver cada página, e prop drilling atravessaria dezenas de componentes.
 * Persistido por usuário em localStorage (mesmo padrão de fmp-growth-view).
 */

export type EstiloVisualizacao = 'nova' | 'classica';

const CHAVE = 'fmp-estilo-graficos';

function leInicial(): EstiloVisualizacao {
  try {
    return localStorage.getItem(CHAVE) === 'classica' ? 'classica' : 'nova';
  } catch {
    return 'nova';
  }
}

let atual: EstiloVisualizacao = leInicial();
const ouvintes = new Set<() => void>();

export function defineEstiloVisualizacao(estilo: EstiloVisualizacao): void {
  if (estilo === atual) return;
  atual = estilo;
  try {
    localStorage.setItem(CHAVE, estilo);
  } catch {
    // localStorage indisponível (modo privado): a escolha vale só nesta aba.
  }
  ouvintes.forEach((fn) => fn());
}

function inscreve(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

function leAtual(): EstiloVisualizacao {
  return atual;
}

/** Hook: re-renderiza o componente quando o estilo muda, em qualquer tela. */
export function useEstiloVisualizacao(): EstiloVisualizacao {
  return useSyncExternalStore(inscreve, leAtual);
}
