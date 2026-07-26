import { supabase } from '@/lib/supabase';

/**
 * Frescor do dado exibido — quando a carga entrou no BANCO, não quando a
 * página foi aberta.
 *
 * O carimbo anterior usava `new Date()` no momento do fetch, então mostrava
 * "agora" mesmo que a carga estivesse parada há dias — exatamente a falha que
 * a migração precisa evitar, e não reproduzir.
 *
 * ⚠️ Nem toda tabela tem coluna de carimbo (verificado no schema em
 * 26/07/2026): as `stg_rm_*` e `stg_google_ads` NÃO têm. Isso é pendência de
 * infraestrutura, não de código — aqui apenas reportamos honestamente que a
 * data não está disponível, em vez de inventar uma.
 */
export const COLUNA_CARIMBO: Record<string, string> = {
  rubeus_registros_personalizada: 'atualizado_em',
  stg_meta_ads: 'atualizado_em',
  pletivo: 'atualizado_em',
  meta_graduacao: 'atualizado_em',
  meta_mestrado: 'atualizado_em',
  meta_pos: 'atualizado_em',
  dim_tipo_beneficio: 'atualizado_em',
};

/**
 * Fontes de cada dashboard, num lugar só — a lógica do carimbo não é
 * duplicada por dashboard. Inclui também as tabelas SEM carimbo: elas
 * aparecem no detalhamento como "sem coluna de data de carga", o que torna a
 * lacuna de infraestrutura visível em vez de escondida.
 */
export const FONTES_POR_DASHBOARD: Record<string, string[]> = {
  'presenca-nacional': ['stg_rm_matriculas_pos', 'stg_rm_matriculas_cursoslivres'],
  'analise-conversao-presidencia': [
    'rubeus_registros_personalizada', 'pletivo', 'meta_mestrado', 'meta_pos',
    'stg_rm_matriculas_grad', 'stg_rm_matriculas_mestrado', 'stg_rm_matriculas_pos',
    'stg_rm_inscricoes_graduacao', 'stg_rm_inscricoes_mestrado',
  ],
  'bolsas-e-descontos': [
    'dim_tipo_beneficio', 'stg_rm_matriculas_bolsas',
    'stg_rm_matriculas_grad', 'stg_rm_matriculas_pos', 'stg_rm_matriculas_mestrado',
  ],
  'analise-de-conversao': [
    'rubeus_registros_personalizada', 'pletivo',
    'meta_graduacao', 'meta_mestrado', 'meta_pos',
    'stg_rm_matriculas_grad', 'stg_rm_matriculas_mestrado', 'stg_rm_matriculas_pos',
    'stg_rm_matriculas_cursoslivres', 'stg_rm_inscricoes_graduacao',
    'stg_rm_inscricoes_mestrado', 'stg_rm_inscricoes_pos', 'stg_rm_inscricoes_cursoslivres',
  ],
  'growth-e-performance': [
    'rubeus_registros_personalizada', 'stg_meta_ads', 'stg_google_ads', 'pletivo',
    'stg_rm_matriculas_grad', 'stg_rm_matriculas_mestrado', 'stg_rm_matriculas_pos',
    'stg_rm_matriculas_cursoslivres', 'stg_rm_inscricoes_graduacao',
    'stg_rm_inscricoes_mestrado', 'stg_rm_inscricoes_pos', 'stg_rm_inscricoes_cursoslivres',
  ],
};

export type Freshness = {
  tabela: string;
  /** null = tabela sem coluna de carimbo (ou consulta falhou) */
  ultimaCarga: Date | null;
  horasAtras: number | null;
  semCarimbo: boolean;
};

export type StatusFrescor = 'ok' | 'atencao' | 'atrasado' | 'desconhecido' | 'erro';

export type FreshnessResumo = {
  /** A fonte MAIS ATRASADA — é ela que define o carimbo do dashboard. */
  maisAntiga: Freshness | null;
  porTabela: Freshness[];
  status: StatusFrescor;
};

const HORA_MS = 3_600_000;

/** Cache por tabela: várias telas compartilham fontes; o banco é free tier. */
const cache = new Map<string, Promise<Date | null>>();

export function limparCacheFrescor(): void {
  cache.clear();
}

/**
 * Uma linha só por tabela: `select <col> order by <col> desc limit 1`.
 * Não pagina e não traz o dataset.
 */
function buscaUltimaCarga(tabela: string, coluna: string): Promise<Date | null> {
  const emCache = cache.get(tabela);
  if (emCache) return emCache;

  const p = (async () => {
    const { data, error } = await supabase
      .from(tabela)
      .select(coluna)
      .order(coluna, { ascending: false })
      .limit(1);
    if (error) throw error;
    const linha = data?.[0] as unknown as Record<string, string> | undefined;
    const valor = linha?.[coluna];
    if (!valor) return null;
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? null : d;
  })();

  cache.set(tabela, p);
  // Um erro não pode ficar preso no cache: a próxima tentativa deve reconsultar.
  p.catch(() => cache.delete(tabela));
  return p;
}

/**
 * Resumo do frescor das tabelas que alimentam um dashboard. O carimbo é o
 * `min` dos `max`: se 3 fontes carregaram hoje e 1 parou há 5 dias, o
 * dashboard está desatualizado há 5 dias — mostrar a mais otimista repetiria
 * o erro que estamos corrigindo.
 */
export async function fetchFreshness(tabelas: string[]): Promise<FreshnessResumo> {
  const porTabela: Freshness[] = [];
  let houveErro = false;

  await Promise.all(
    tabelas.map(async (tabela) => {
      const coluna = COLUNA_CARIMBO[tabela];
      if (!coluna) {
        porTabela.push({ tabela, ultimaCarga: null, horasAtras: null, semCarimbo: true });
        return;
      }
      try {
        const ultimaCarga = await buscaUltimaCarga(tabela, coluna);
        porTabela.push({
          tabela,
          ultimaCarga,
          horasAtras: ultimaCarga ? (Date.now() - ultimaCarga.getTime()) / HORA_MS : null,
          semCarimbo: false,
        });
      } catch {
        houveErro = true;
        porTabela.push({ tabela, ultimaCarga: null, horasAtras: null, semCarimbo: false });
      }
    }),
  );

  porTabela.sort((a, b) => {
    if (a.ultimaCarga && b.ultimaCarga) return a.ultimaCarga.getTime() - b.ultimaCarga.getTime();
    if (a.ultimaCarga) return -1;
    if (b.ultimaCarga) return 1;
    return a.tabela.localeCompare(b.tabela);
  });

  const comData = porTabela.filter((f) => f.ultimaCarga !== null);
  const maisAntiga = comData[0] ?? null;

  let status: StatusFrescor;
  if (!maisAntiga) {
    // Nenhuma fonte com data: ou nenhuma tem carimbo, ou tudo falhou.
    status = houveErro ? 'erro' : 'desconhecido';
  } else {
    const h = maisAntiga.horasAtras ?? 0;
    status = h < 24 ? 'ok' : h <= 72 ? 'atencao' : 'atrasado';
  }

  return { maisAntiga, porTabela, status };
}

export function formataDataHora(d: Date): string {
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function diasAtras(horas: number): number {
  return Math.floor(horas / 24);
}
