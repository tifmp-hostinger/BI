import { assinaturaCarga } from '@/lib/dataFreshness';
import { cacheValido, gravaCache, leCache } from '@/lib/datasetCache';

export type OrigemDado = 'cache' | 'rede';

/**
 * Carrega o dataset de um dashboard mostrando primeiro o que já está guardado
 * e só baixando de novo quando há motivo ("stale-while-revalidate").
 *
 * Sequência:
 *  1. lê o cache local e, se houver algo, entrega NA HORA (`mostrar`);
 *  2. em paralelo, pergunta ao banco se a carga mudou — uma consulta de uma
 *     linha por tabela com carimbo, não o dataset;
 *  3. se não mudou e o cache é do mesmo dia, termina aqui: zero download;
 *  4. se mudou (ou não havia cache), baixa e entrega de novo, agora da rede.
 *
 * `mostrar` pode então ser chamado duas vezes: primeiro com o dado guardado,
 * depois com o atualizado. Quem chama decide o que fazer com a origem — a
 * interface usa isso para sinalizar "atualizando" sem travar a tela.
 */
export async function carregaComCache<T>(opcoes: {
  /** Identificador do dataset no cache. Um por dashboard. */
  chave: string;
  /** Tabelas do dashboard, para calcular a assinatura da carga. */
  tabelas: string[];
  /** Baixa o dataset completo da rede. Deve ignorar caches em memória. */
  baixar: () => Promise<T>;
  /** Recebe o dataset a cada vez que há algo a exibir. */
  mostrar: (dataset: T, origem: OrigemDado) => void;
  /** Chamado quando um download de fato vai começar (para sinalizar na tela). */
  aoIniciarDownload?: (temDadoNaTela: boolean) => void;
  /** Ignora o cache e baixa direto (botão "Atualizar"). */
  forcar?: boolean;
}): Promise<void> {
  const { chave, tabelas, baixar, mostrar, aoIniciarDownload, forcar = false } = opcoes;

  let temDadoNaTela = false;

  if (!forcar) {
    // Cache e assinatura em paralelo: a assinatura é barata e não deve
    // atrasar a exibição do que já está guardado.
    const [entrada, assinatura] = await Promise.all([
      leCache<T>(chave).catch(() => null),
      assinaturaCarga(tabelas),
    ]);

    if (entrada) {
      mostrar(entrada.dataset, 'cache');
      temDadoNaTela = true;
      if (cacheValido(entrada, assinatura)) return; // nada mudou: sem download
    }
  }

  aoIniciarDownload?.(temDadoNaTela);
  const dataset = await baixar();
  mostrar(dataset, 'rede');

  // Assinatura relida DEPOIS do download, ignorando o cache de consulta: se a
  // carga rodou durante o download (ou antes, num "Atualizar" manual), gravar
  // a assinatura antiga faria a próxima visita rebaixar tudo sem necessidade.
  const assinaturaFinal = await assinaturaCarga(tabelas, { ignorarCache: true });
  if (assinaturaFinal === null) return; // sem assinatura confiável, não grava

  await gravaCache(chave, dataset, assinaturaFinal).catch(() => {
    // Sem espaço ou sem permissão: o app segue normalmente, só sem cache.
  });
}
