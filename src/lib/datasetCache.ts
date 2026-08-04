/**
 * Cache dos datasets dos dashboards no navegador (IndexedDB).
 *
 * Motivação: cada painel baixa as tabelas brutas e calcula no cliente — o de
 * Bolsas sozinho são ~129 mil linhas / ~38 MB em ~129 requisições. Havia cache
 * apenas em memória, que morre a cada F5 ou aba nova, então na prática o
 * usuário esperava esse download quase toda vez.
 *
 * Estratégia: mostrar o dado guardado IMEDIATAMENTE e revalidar atrás
 * ("stale-while-revalidate"). O download novo só acontece quando há motivo.
 *
 * Por que IndexedDB e não localStorage: localStorage é síncrono, guarda texto e
 * estoura em poucos MB — travaria a interface e não caberia. IndexedDB é
 * assíncrono e guarda o objeto direto.
 *
 * Por que não há horário de atualização: a carga não roda em hora fixa nem
 * todo dia (medido: 27/07 11:47, 29/07 12:25, 31/07 09:14, 03/08 14:50).
 * Qualquer horário fixo estaria errado na maioria dos dias. Ver `cacheValido`.
 */

const NOME_BANCO = 'fmp-bi-cache';
const NOME_STORE = 'datasets';

/**
 * Muda quando o FORMATO do dataset muda (colunas novas, tipos diferentes).
 * Sem isso, um cache antigo alimentaria cálculos novos com dados incompletos —
 * erro silencioso, o pior tipo. Incremente ao alterar as queries.
 */
export const VERSAO_CACHE = 1;

export type EntradaCache<T> = {
  dataset: T;
  /** Carimbos de carga conhecidos no momento da gravação. */
  assinatura: string;
  /** Momento da gravação (epoch ms). */
  gravadoEm: number;
  versao: number;
};

let avisoQuotaEmitido = false;

function abreBanco(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(NOME_BANCO, 1);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(NOME_STORE)) db.createObjectStore(NOME_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    // Navegação privada ou armazenamento bloqueado: segue sem cache, não quebra.
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

function comStore<R>(
  modo: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<R>,
): Promise<R | null> {
  return abreBanco().then(
    (db) =>
      new Promise<R | null>((resolve) => {
        if (!db) return resolve(null);
        let req: IDBRequest<R>;
        try {
          req = fn(db.transaction(NOME_STORE, modo).objectStore(NOME_STORE));
        } catch {
          db.close();
          return resolve(null);
        }
        req.onsuccess = () => {
          resolve(req.result);
          db.close();
        };
        req.onerror = () => {
          // QuotaExceededError entra aqui: o dataset é grande demais para o
          // espaço disponível. Seguir sem cache é degradação aceitável.
          if (!avisoQuotaEmitido) {
            avisoQuotaEmitido = true;
            console.warn('[cache] não foi possível usar o cache local:', req.error?.name);
          }
          resolve(null);
          db.close();
        };
      }),
  );
}

/** Dia civil local, para a regra de validade. */
function diaCivil(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * O cache serve se: mesmo formato, mesmos carimbos de carga e mesmo dia civil.
 *
 * A regra do dia cobre as tabelas do RM, que NÃO têm carimbo de carga — para
 * elas não há como perguntar "mudou?" de forma barata, então o cache nunca
 * atravessa a virada do dia sem uma reconferência.
 */
export function cacheValido<T>(
  entrada: EntradaCache<T> | null,
  assinaturaAtual: string | null,
): boolean {
  if (!entrada) return false;
  if (entrada.versao !== VERSAO_CACHE) return false;
  // Assinatura desconhecida (falha ao consultar): não dá para afirmar que o
  // cache está atual, então rebaixa — erra-se para o lado do dado correto.
  if (assinaturaAtual === null) return false;
  if (entrada.assinatura !== assinaturaAtual) return false;
  return diaCivil(entrada.gravadoEm) === diaCivil(Date.now());
}

export async function leCache<T>(chave: string): Promise<EntradaCache<T> | null> {
  const bruto = await comStore<EntradaCache<T>>('readonly', (s) => s.get(chave) as IDBRequest<EntradaCache<T>>);
  if (!bruto || typeof bruto !== 'object') return null;
  if (bruto.versao !== VERSAO_CACHE) return null;
  return bruto;
}

export async function gravaCache<T>(chave: string, dataset: T, assinatura: string): Promise<void> {
  const entrada: EntradaCache<T> = {
    dataset,
    assinatura,
    gravadoEm: Date.now(),
    versao: VERSAO_CACHE,
  };
  await comStore('readwrite', (s) => s.put(entrada, chave) as IDBRequest<IDBValidKey>);
}

export async function limpaCache(chave: string): Promise<void> {
  await comStore('readwrite', (s) => s.delete(chave) as IDBRequest<undefined>);
}
