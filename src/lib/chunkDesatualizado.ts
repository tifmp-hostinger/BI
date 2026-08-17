/**
 * Recuperação de "chunk órfão" depois de um deploy.
 *
 * As páginas dos dashboards são carregadas sob demanda (React.lazy), e o Vite
 * dá a cada uma um nome com hash — `assets/page-D0tO9fO_.js`. Quando sobe uma
 * versão nova, o container troca a pasta `assets/` inteira: os arquivos da
 * versão anterior deixam de existir.
 *
 * Quem estava com a aba aberta continua rodando o app ANTIGO. Ao abrir um
 * painel que ainda não tinha visitado, o navegador pede o arquivo com o hash
 * velho, recebe 404 e o import falha com "Falhou em buscar módulo importado
 * dinamicamente". Não é erro de dado nem de rede do usuário: é a versão em
 * memória pedindo um arquivo que o servidor não tem mais.
 *
 * O "Tentar novamente" do cartão de erro não resolvia — repetia o mesmo
 * import, para a mesma URL morta. O que resolve é recarregar a página:
 * `index.html` é servido com `no-store` (ver docker/nginx.conf), então a
 * recarga traz o índice novo, com os nomes de arquivo novos.
 */

const CHAVE = 'fmp-recarga-pos-deploy';
/** Janela para considerar que a recarga já foi tentada e não adiantou. */
const JANELA_MS = 10_000;

export function pareceChunkDesatualizado(erro: unknown): boolean {
  const msg = erro instanceof Error ? erro.message : String(erro ?? '');
  return /dynamically imported module|dinamicamente|Importing a module script failed|ChunkLoadError|Failed to fetch/i.test(
    msg,
  );
}

/**
 * Recarrega a página uma vez. Devolve `true` se a recarga foi disparada.
 *
 * A trava é por TEMPO, não um "já recarreguei nesta sessão": se a recarga
 * acabou de acontecer e o erro voltou, o arquivo realmente não existe e
 * insistir viraria laço infinito — melhor mostrar o erro. Passados alguns
 * segundos, um deploy seguinte na mesma sessão volta a poder se recuperar
 * sozinho.
 */
export function recarregaAposDeploy(): boolean {
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

/**
 * O Vite emite `vite:preloadError` quando o preload de um chunk falha — chega
 * antes do erro subir para o ErrorBoundary, e cobre também os preloads que o
 * roteador dispara sem estar renderizando nada.
 */
export function instalaRecuperacaoDeDeploy(): void {
  window.addEventListener('vite:preloadError', (evento) => {
    if (recarregaAposDeploy()) evento.preventDefault();
  });
}
