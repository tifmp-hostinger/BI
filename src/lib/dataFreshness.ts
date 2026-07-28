import { supabase } from '@/lib/supabase';
import { parseFlexibleDate } from '@/dashboards/analise-de-conversao/dateUtils';

/**
 * Frescor do dado exibido — quando a carga entrou no banco, não quando a
 * página foi aberta.
 *
 * Duas fontes de sinal, nunca misturadas:
 * - `colunaCarga`: carimbo REAL de quando a linha foi gravada/atualizada
 *   (ex. `atualizado_em`). Quando existe, é a fonte da verdade.
 * - `colunaConteudo`: PROXY — a maior data de negócio já presente na
 *   tabela (ex. `datamatricula`). Não afirma quando a carga rodou, só que
 *   o registro mais novo é daquela data. Um fim de semana sem matrícula
 *   produz proxy "atrasado" com a carga em dia — isso é esperado, por isso
 *   os limiares do proxy são mais frouxos e o texto nunca diz "carga
 *   parada", só "pode haver carga parada".
 *
 * Tabelas de DOMÍNIO (`meta_*`, `pletivo`, `dim_tipo_beneficio`) são
 * editadas à mão e não representam uma esteira de carga — nunca entram no
 * cálculo do rótulo principal, só aparecem no detalhamento como
 * "tabelas de referência", sem alerta de atraso.
 *
 * O proxy de conteúdo NUNCA dispara uma consulta nova: os dashboards já
 * baixam essas tabelas inteiras para calcular os indicadores, então o
 * proxy é computado sobre o dataset que já está em memória (ver
 * `maiorDataDoDataset` abaixo) e passado para `fetchFreshness` via
 * `proxiesEmMemoria`. Só as tabelas com `colunaCarga` justificam consulta
 * dedicada — e é uma linha cada.
 */

export type PapelTabela = 'fato' | 'dominio';

export type FonteConfig = {
  tabela: string;
  papel: PapelTabela;
  /** Carimbo real de carga (`atualizado_em` ou equivalente). */
  colunaCarga?: string;
  /** Proxy: maior data de negócio na tabela. Calculado em memória — nunca via query dedicada. */
  colunaConteudo?: string;
  /** Documentação do formato de `colunaConteudo` — o parser (`parseFlexibleDate`) já detecta os dois sozinho. */
  formatoConteudo?: 'iso' | 'br';
};

/**
 * Registro único de todas as tabelas conhecidas. Checado no schema em
 * 28/07/2026.
 *
 * ⚠️ Duas tabelas — `stg_rm_inscricoes_graduacao` e `stg_rm_inscricoes_mestrado`
 * — tinham sido classificadas como "sem proxy utilizável" (só `periodo_letivo`)
 * numa versão anterior deste levantamento. Reconferido direto no banco: as
 * duas têm `datainscricao` 100% preenchida (3.461/3.461 e 489/489, datas
 * plausíveis até 2026-07-26). Corrigido aqui para usar o proxy real —
 * reportado como divergência, não aplicado às cegas.
 */
export const REGISTRO_FONTES: Record<string, FonteConfig> = {
  // ---- Domínio: editadas à mão, sem esteira de carga, sem alerta ----
  meta_graduacao: { tabela: 'meta_graduacao', papel: 'dominio', colunaCarga: 'atualizado_em' },
  meta_mestrado: { tabela: 'meta_mestrado', papel: 'dominio', colunaCarga: 'atualizado_em' },
  meta_pos: { tabela: 'meta_pos', papel: 'dominio', colunaCarga: 'atualizado_em' },
  pletivo: { tabela: 'pletivo', papel: 'dominio', colunaCarga: 'atualizado_em' },
  dim_tipo_beneficio: { tabela: 'dim_tipo_beneficio', papel: 'dominio', colunaCarga: 'atualizado_em' },

  // ---- Fato com carimbo real de carga ----
  stg_meta_ads: { tabela: 'stg_meta_ads', papel: 'fato', colunaCarga: 'atualizado_em' },
  rubeus_registros_personalizada: {
    tabela: 'rubeus_registros_personalizada',
    papel: 'fato',
    colunaCarga: 'atualizado_em',
  },

  // ---- Fato sem carimbo, com proxy de conteúdo (formato ISO) ----
  stg_google_ads: { tabela: 'stg_google_ads', papel: 'fato', colunaConteudo: 'date', formatoConteudo: 'iso' },
  stg_rh_infofolha: {
    tabela: 'stg_rh_infofolha',
    papel: 'fato',
    colunaConteudo: 'recmodifiedon',
    formatoConteudo: 'iso',
  },
  stg_rm_matriculas_cursoslivres: {
    tabela: 'stg_rm_matriculas_cursoslivres',
    papel: 'fato',
    colunaConteudo: 'data_contrato',
    formatoConteudo: 'iso',
  },
  stg_rm_inscricoes_pos: {
    tabela: 'stg_rm_inscricoes_pos',
    papel: 'fato',
    colunaConteudo: 'datainscricao',
    formatoConteudo: 'iso',
  },
  stg_rm_matriculas_pos: {
    tabela: 'stg_rm_matriculas_pos',
    papel: 'fato',
    colunaConteudo: 'datadematricula',
    formatoConteudo: 'iso',
  },
  stg_rm_inscricoes_cursoslivres: {
    tabela: 'stg_rm_inscricoes_cursoslivres',
    papel: 'fato',
    colunaConteudo: 'datainscricao',
    formatoConteudo: 'iso',
  },
  stg_rm_inscricoes_graduacao: {
    tabela: 'stg_rm_inscricoes_graduacao',
    papel: 'fato',
    colunaConteudo: 'datainscricao',
    formatoConteudo: 'iso',
  },
  stg_rm_inscricoes_mestrado: {
    tabela: 'stg_rm_inscricoes_mestrado',
    papel: 'fato',
    colunaConteudo: 'datainscricao',
    formatoConteudo: 'iso',
  },

  // ---- Fato sem carimbo, com proxy de conteúdo (formato dd/mm/yyyy) ----
  // Verificado no banco: max() textual dessas colunas devolve lixo (ex.
  // stg_rm_matriculas_bolsas: max textual = "31/12/2022", max real = 2026-07-06).
  // NUNCA comparar como texto — sempre via parseFlexibleDate.
  stg_rm_matriculas_grad: {
    tabela: 'stg_rm_matriculas_grad',
    papel: 'fato',
    colunaConteudo: 'datamatricula',
    formatoConteudo: 'br',
  },
  stg_rm_matriculas_mestrado: {
    tabela: 'stg_rm_matriculas_mestrado',
    papel: 'fato',
    colunaConteudo: 'datamatricula',
    formatoConteudo: 'br',
  },
  stg_rm_matriculas_bolsas: {
    tabela: 'stg_rm_matriculas_bolsas',
    papel: 'fato',
    colunaConteudo: 'data_matricula',
    formatoConteudo: 'br',
  },

  // ---- Fato sem carimbo e sem proxy utilizável (schema conferido: só têm periodo_letivo) ----
  stg_rm_matriculas_cadeiras: { tabela: 'stg_rm_matriculas_cadeiras', papel: 'fato' },
  stg_rm_evasao_motor: { tabela: 'stg_rm_evasao_motor', papel: 'fato' },
  stg_rm_evasao_inadimplencia: { tabela: 'stg_rm_evasao_inadimplencia', papel: 'fato' },
  stg_rm_rh_infofuncionarios: { tabela: 'stg_rm_rh_infofuncionarios', papel: 'fato' },
};

/**
 * Fontes de cada dashboard. Cada tabela listada aqui precisa existir em
 * REGISTRO_FONTES — senão vira "sem sinal" por omissão de cadastro, não
 * por ausência real de coluna.
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

export type TipoSinal = 'carga' | 'proxy' | 'sem-sinal';

export type Freshness = {
  tabela: string;
  papel: PapelTabela;
  tipoSinal: TipoSinal;
  /** Carimbo real (tipoSinal='carga') ou maior data de conteúdo (tipoSinal='proxy'). */
  data: Date | null;
  horasAtras: number | null;
};

export type StatusFrescor = 'ok' | 'atencao' | 'atrasado' | 'desconhecido' | 'erro';

export type FreshnessResumo = {
  /** A fonte de FATO mais atrasada — nunca uma tabela de domínio. */
  maisAntiga: Freshness | null;
  /** Todas as tabelas de fato (carga + proxy + sem-sinal), para o detalhamento. */
  fontesFato: Freshness[];
  /** Tabelas de domínio, mostradas à parte, sem alerta. */
  fontesDominio: Freshness[];
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
 * Não pagina e não traz o dataset. Usado SÓ para colunaCarga — o proxy de
 * conteúdo nunca dispara consulta (vem do dataset já em memória).
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
 * Proxy de conteúdo: maior data válida de uma coluna, sobre um dataset que
 * o dashboard JÁ tem em memória (sem filtro de data do usuário — senão o
 * proxy vira reflexo do filtro, não do estado da carga). Reaproveita
 * `parseFlexibleDate` (mesmo parser dos cálculos de negócio) porque ele já
 * detecta ISO e dd/mm/yyyy sozinho — comparar como string aqui reproduziria
 * o bug documentado em REGISTRO_FONTES (max textual de dd/mm/yyyy é lixo).
 */
export function maiorDataDoDataset<T>(
  rows: readonly T[] | undefined | null,
  coluna: keyof T,
): Date | null {
  if (!rows) return null;
  let max: Date | null = null;
  for (const r of rows) {
    const bruto = r[coluna] as unknown as string | null | undefined;
    const d = parseFlexibleDate(bruto);
    if (d && (!max || d.getTime() > max.getTime())) max = d;
  }
  return max;
}

/**
 * Resumo do frescor das tabelas que alimentam um dashboard.
 *
 * `proxiesEmMemoria`: mapa tabela → maior data de conteúdo, já calculado
 * pelo dashboard sobre o dataset que ele já baixou (ver `maiorDataDoDataset`).
 * Obrigatório para toda tabela com `colunaConteudo` — sem ele, a tabela
 * aparece como "sem sinal" em vez de disparar uma consulta nova.
 */
export async function fetchFreshness(
  tabelas: string[],
  proxiesEmMemoria: Record<string, Date | null> = {},
): Promise<FreshnessResumo> {
  const fontesFato: Freshness[] = [];
  const fontesDominio: Freshness[] = [];
  let houveErro = false;

  await Promise.all(
    tabelas.map(async (tabela) => {
      const cfg = REGISTRO_FONTES[tabela];

      if (!cfg) {
        fontesFato.push({ tabela, papel: 'fato', tipoSinal: 'sem-sinal', data: null, horasAtras: null });
        return;
      }

      const destino = cfg.papel === 'dominio' ? fontesDominio : fontesFato;

      if (cfg.colunaCarga) {
        try {
          const data = await buscaUltimaCarga(tabela, cfg.colunaCarga);
          destino.push({
            tabela,
            papel: cfg.papel,
            tipoSinal: 'carga',
            data,
            horasAtras: data ? (Date.now() - data.getTime()) / HORA_MS : null,
          });
        } catch {
          houveErro = true;
          destino.push({ tabela, papel: cfg.papel, tipoSinal: 'carga', data: null, horasAtras: null });
        }
        return;
      }

      if (cfg.colunaConteudo) {
        const data = proxiesEmMemoria[tabela] ?? null;
        destino.push({
          tabela,
          papel: cfg.papel,
          tipoSinal: 'proxy',
          data,
          horasAtras: data ? (Date.now() - data.getTime()) / HORA_MS : null,
        });
        return;
      }

      destino.push({ tabela, papel: cfg.papel, tipoSinal: 'sem-sinal', data: null, horasAtras: null });
    }),
  );

  const ordenaPorData = (a: Freshness, b: Freshness) => {
    if (a.data && b.data) return a.data.getTime() - b.data.getTime();
    if (a.data) return -1;
    if (b.data) return 1;
    return a.tabela.localeCompare(b.tabela);
  };
  fontesFato.sort(ordenaPorData);
  fontesDominio.sort(ordenaPorData);

  // O rótulo principal olha só para fato — domínio nunca entra aqui.
  const candidatas = fontesFato.filter((f) => f.data !== null);
  const maisAntiga = candidatas.sort((a, b) => a.data!.getTime() - b.data!.getTime())[0] ?? null;

  let status: StatusFrescor;
  if (!maisAntiga) {
    status = houveErro ? 'erro' : 'desconhecido';
  } else {
    const h = maisAntiga.horasAtras ?? 0;
    if (maisAntiga.tipoSinal === 'carga') {
      // Carimbo real: limiar em horas.
      status = h < 24 ? 'ok' : h <= 72 ? 'atencao' : 'atrasado';
    } else {
      // Proxy de conteúdo: limiar em dias — movimento de negócio é irregular,
      // um fim de semana sem matrícula não é "carga parada".
      const dias = h / 24;
      status = dias < 7 ? 'ok' : dias <= 14 ? 'atencao' : 'atrasado';
    }
  }

  return { maisAntiga, fontesFato, fontesDominio, status };
}

export function formataDataHora(d: Date): string {
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** Rótulo curto (dd/mm) para o proxy de conteúdo — deliberadamente menos preciso que formataDataHora. */
export function formataDataCurta(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function diasAtras(horas: number): number {
  return Math.floor(horas / 24);
}
