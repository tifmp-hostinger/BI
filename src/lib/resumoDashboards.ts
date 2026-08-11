import { fmtBRLCompact, fmtInt, fmtIntCompact } from '@/lib/formatters';
import { leCache, leMeta, leResumo, gravaResumo } from '@/lib/datasetCache';

/**
 * Extratores do mini-resumo exibido nos cards da Central de Dashboards.
 *
 * Cada função recebe o dataset JÁ BAIXADO pelo aquecimento (nunca dispara
 * consulta) e devolve 1-2 números-manchete pré-formatados. Os rótulos dizem
 * "no histórico" implicitamente — são volumes totais da base, estáveis, e
 * NÃO precisam bater com os KPIs filtrados que o painel abre por padrão.
 *
 * Defensivo por construção: o dataset chega como `unknown` (veio do
 * IndexedDB, pode ser de uma versão antiga do app) — qualquer formato
 * inesperado devolve lista vazia em vez de quebrar a Home.
 */

type Item = { rotulo: string; valor: string };

function tamanho(v: unknown): number | null {
  return Array.isArray(v) ? v.length : null;
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

export const EXTRATORES_RESUMO: Record<string, (dataset: unknown) => Item[]> = {
  'presenca-nacional': (ds) => {
    if (!Array.isArray(ds)) return [];
    const ufs = new Set(
      ds.map((r) => (r as { estado?: unknown }).estado).filter((e) => typeof e === 'string' && e),
    );
    const itens: Item[] = [{ rotulo: 'matrículas mapeadas', valor: fmtIntCompact(ds.length) }];
    if (ufs.size > 0) itens.push({ rotulo: 'estados alcançados', valor: fmtInt(ufs.size) });
    return itens;
  },

  'analise-conversao-presidencia': (ds) => {
    const base = ds as { matriculasGrad?: unknown; inscricoesGrad?: unknown };
    const mat = tamanho(base?.matriculasGrad);
    const insc = tamanho(base?.inscricoesGrad);
    const itens: Item[] = [];
    if (insc !== null) itens.push({ rotulo: 'inscrições Graduação', valor: fmtIntCompact(insc) });
    if (mat !== null) itens.push({ rotulo: 'matrículas Graduação', valor: fmtIntCompact(mat) });
    return itens;
  },

  'bolsas-e-descontos': (ds) => {
    const base = ds as { enrichedRows?: unknown };
    const linhas = tamanho(base?.enrichedRows);
    if (linhas === null) return [];
    return [{ rotulo: 'matrículas com benefício', valor: fmtIntCompact(linhas) }];
  },

  'analise-de-conversao': (ds) => {
    const base = ds as { rubeus?: unknown; matriculasPos?: unknown };
    const leads = tamanho(base?.rubeus);
    const pos = tamanho(base?.matriculasPos);
    const itens: Item[] = [];
    if (leads !== null) itens.push({ rotulo: 'interações de leads', valor: fmtIntCompact(leads) });
    if (pos !== null) itens.push({ rotulo: 'matrículas Especializações', valor: fmtIntCompact(pos) });
    return itens;
  },

  'growth-e-performance': (ds) => {
    const base = ds as {
      google?: { costmicros?: unknown }[];
      meta?: { spend?: unknown; date_start?: unknown; adset_id?: unknown }[];
    };
    if (!Array.isArray(base?.google) || !Array.isArray(base?.meta)) return [];
    // stg_meta_ads é formato LONGO (uma linha por action_type): o spend se
    // repete em cada linha do mesmo (date_start, adset_id). Somar cru
    // inflaria o investimento várias vezes — dedup igual ao dashboard.
    const spendMeta = new Map<string, number>();
    for (const r of base.meta) {
      spendMeta.set(`${r?.date_start}|${r?.adset_id}`, num(r?.spend));
    }
    const investido =
      base.google.reduce((s, r) => s + num(r?.costmicros) / 1_000_000, 0) +
      Array.from(spendMeta.values()).reduce((s, v) => s + v, 0);
    if (investido <= 0) return [];
    return [{ rotulo: 'investidos em mídia', valor: fmtBRLCompact(investido) }];
  },
};

/**
 * Garante o resumo de um painel após o aquecimento.
 *
 * `datasetEmMaos`: quando o aquecimento acabou de baixar, o dataset já está
 * na memória — grava direto. Quando o cache já estava quente (caso comum), o
 * resumo da visita anterior costuma existir; só se ele faltar ou estiver
 * mais velho que o cache é que vale pagar UMA desserialização em segundo
 * plano para criá-lo.
 */
export async function atualizaResumo(chave: string, datasetEmMaos: unknown): Promise<void> {
  const extrator = EXTRATORES_RESUMO[chave];
  if (!extrator) return;

  try {
    if (datasetEmMaos !== null && datasetEmMaos !== undefined) {
      const itens = extrator(datasetEmMaos);
      if (itens.length > 0) await gravaResumo(chave, itens);
      return;
    }

    const [resumo, meta] = await Promise.all([leResumo(chave), leMeta(chave)]);
    if (!meta) return;
    // Margem de 60s: dentro de um mesmo aquecimento o resumo é gravado
    // instantes antes da meta e ainda assim está atual.
    if (resumo && resumo.gravadoEm + 60_000 >= meta.gravadoEm) return;

    const entrada = await leCache<unknown>(chave);
    if (!entrada) return;
    const itens = extrator(entrada.dataset);
    if (itens.length > 0) await gravaResumo(chave, itens);
  } catch {
    // Resumo é decorativo: falha aqui nunca pode afetar aquecimento nem Home.
  }
}
