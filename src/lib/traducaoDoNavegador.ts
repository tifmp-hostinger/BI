/**
 * Tradução automática do navegador vs. React.
 *
 * O tradutor do Chrome (e o do Edge) não pinta texto por cima: ele FATIA cada
 * nó de texto, embrulha os pedaços em <font> e reposiciona os nós na árvore.
 * O React guardou referências para os nós originais, que agora têm outro pai —
 * então a próxima atualização estoura com:
 *
 *   Failed to execute 'insertBefore' on 'Node': The node before which the new
 *   node is to be inserted is not a child of this node.
 *
 * O painel inteiro cai no ErrorBoundary. Não é erro de dado nem de rede: é o
 * DOM sendo reescrito por baixo do React.
 *
 * A prevenção está no `index.html` (lang="pt-BR", translate="no",
 * meta notranslate). Este módulo é a rede de segurança para quem já tem a
 * tradução ligada ou usa uma extensão que faz o mesmo — e existe para
 * transformar uma mensagem técnica indecifrável em instrução acionável.
 */

const CHAVE = 'fmp-recarga-dom-corrompido';
/** Janela para considerar que a recarga já foi tentada e não adiantou. */
const JANELA_MS = 15_000;

/**
 * Erro de reconciliação causado por alteração externa do DOM.
 *
 * A mensagem é casada em inglês E em português porque o próprio texto do erro
 * chega traduzido quando a tradução está ativa — foi exatamente assim que o
 * caso real apareceu: a tela exibia "Falha ao executar 'insertBefore' em
 * 'Node'", que o Chrome nunca produz (DOMException não é localizada).
 */
export function pareceDomCorrompido(erro: unknown): boolean {
  const msg = erro instanceof Error ? erro.message : String(erro ?? '');
  const operacaoDeDom = /insertBefore|removeChild|appendChild/i.test(msg);
  if (!operacaoDeDom) return false;
  return /is not a child of this node|não é filho deste nó|nao e filho deste no/i.test(msg);
}

/**
 * A página está traduzida NESTE momento.
 *
 * O tradutor do Google marca o <html> com `translated-ltr` / `translated-rtl`;
 * o da Microsoft deixa `_msttexthash` nos <font> que injeta. Verificação
 * síncrona e barata, sem observar mutação.
 */
export function paginaTraduzida(): boolean {
  try {
    const raiz = document.documentElement;
    if (raiz.classList.contains('translated-ltr') || raiz.classList.contains('translated-rtl')) {
      return true;
    }
    return !!document.querySelector('font[_msttexthash], font[_mstmutation]');
  } catch {
    return false;
  }
}

/**
 * Recarrega a página uma única vez. Devolve `true` se a recarga foi disparada.
 *
 * Só vale a pena quando a página NÃO está traduzida — aí a corrupção foi
 * pontual (extensão que injetou algo uma vez) e a recarga limpa o estado. Com
 * a tradução ligada, recarregar é laço infinito: o tradutor traduz de novo e o
 * erro volta. Nesse caso quem chama mostra a instrução em vez de recarregar.
 *
 * A trava é por TEMPO, não "já recarreguei nesta sessão": se a recarga acabou
 * de acontecer e o erro voltou, insistir viraria laço; passados alguns
 * segundos, um novo episódio pode se recuperar sozinho de novo. Mesmo padrão
 * de `chunkDesatualizado.recarregaAposDeploy`.
 */
export function recuperaDeDomCorrompido(): boolean {
  if (paginaTraduzida()) return false;

  let ultima = 0;
  try {
    ultima = Number(sessionStorage.getItem(CHAVE) ?? 0);
    if (Number.isFinite(ultima) && Date.now() - ultima < JANELA_MS) return false;
    sessionStorage.setItem(CHAVE, String(Date.now()));
  } catch {
    // sessionStorage bloqueado: sem trava não há como evitar laço, então
    // prefere-se não recarregar e deixar o usuário decidir.
    return false;
  }
  window.location.reload();
  return true;
}
