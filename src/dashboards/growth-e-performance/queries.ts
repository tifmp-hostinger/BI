import { loadAllFrom } from '@/lib/supabasePaginate';
import { supabase } from '@/lib/supabase';
import { toISODate } from '../analise-de-conversao/dateUtils';
import type { RawPletivoRow } from '../analise-de-conversao/types';
import type {
  GrowthDataset,
  InscPorDia,
  RawGoogleAdsRow,
  RawMatCLGrowthRow,
  RawMatGradMestRow,
  RawMatPosGrowthRow,
  RawMetaAdsRow,
  RawRubeusGrowthRow,
} from './types';

// Cache em nível de módulo: navegar para outro dashboard e voltar não refaz
// o download. O botão "Atualizar" usa clearGrowthCache().
let cachedDataset: GrowthDataset | null = null;

export function clearGrowthCache(): void {
  cachedDataset = null;
}

export type LoadProgress = (etapa: number, totalEtapas: number, descricao: string) => void;

const TOTAL_ETAPAS = 4;

/**
 * Agrega inscrições por dia logo após o fetch e descarta o array bruto —
 * stg_rm_inscricoes_cursoslivres tem 110k+ linhas.
 * Herança §7.11: o Power Query truncava essa tabela em 100.000 linhas; aqui
 * não há teto, então o app tende a mostrar MAIS inscritos que o BI. Esperado.
 */
async function loadInscPorDia(table: string): Promise<InscPorDia[]> {
  const rows = (await loadAllFrom(table, 'datainscricao')) as { datainscricao: string | null }[];
  const porDia = new Map<string, number>();
  for (const r of rows) {
    const iso = toISODate(r.datainscricao);
    if (!iso) continue;
    porDia.set(iso, (porDia.get(iso) ?? 0) + 1);
  }
  return Array.from(porDia.entries())
    .map(([data, total]) => ({ data, total }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

/**
 * Carrega em 4 lotes sequenciais (não tudo em paralelo) para não estourar o
 * limite de requisições simultâneas do Supabase — mesmo padrão do
 * analise-de-conversao.
 */
export async function fetchGrowthData(
  onProgress?: LoadProgress,
  forceRefresh = false,
): Promise<GrowthDataset> {
  if (cachedDataset && !forceRefresh) return cachedDataset;

  // Lote 1 — pletivo + CRM (Rubeus)
  onProgress?.(1, TOTAL_ETAPAS, 'Carregando leads do CRM');
  const pletivo = await loadPletivo();
  const rubeus = (await loadAllFrom(
    'rubeus_registros_personalizada',
    'momento_date,momento_hora,nome_dia,processo,canal_nome,status_oportunidade',
  )) as RawRubeusGrowthRow[];

  // Lote 2 — mídia paga
  onProgress?.(2, TOTAL_ETAPAS, 'Carregando mídia (Google e Meta)');
  const google = (await loadAllFrom(
    'stg_google_ads',
    'date,geotargetstate,campaign_name,impressions,clicks,costmicros,conversions',
  )) as RawGoogleAdsRow[];
  const meta = (await loadAllFrom(
    'stg_meta_ads',
    'date_start,campaign_name,adset_id,impressions,clicks,spend,reach,action_type,value',
  )) as RawMetaAdsRow[];

  // Lote 3 — matrículas
  onProgress?.(3, TOTAL_ETAPAS, 'Carregando matrículas');
  const gradMestCols = 'aluno,situacao,datamatricula,datacontrato,datacancelamentocontrato,faturadoliq';
  const matGrad = (await loadAllFrom('stg_rm_matriculas_grad', gradMestCols)) as RawMatGradMestRow[];
  const matMestrado = (await loadAllFrom('stg_rm_matriculas_mestrado', gradMestCols)) as RawMatGradMestRow[];
  const matPos = (await loadAllFrom(
    'stg_rm_matriculas_pos',
    'aluno,curso,situacao,descontoaluno,distanciapresencial,bolsas,bolsa3,databaixa,datacancelamentomatricula,inscricaodata,faturadoliq',
  )) as RawMatPosGrowthRow[];
  const matCL = (await loadAllFrom(
    'stg_rm_matriculas_cursoslivres',
    'aluno,situacao_matricula,databaixa,data_contrato,valor_curso_com_desconto',
  )) as RawMatCLGrowthRow[];

  // Lote 4 — inscrições (agregadas por dia; CL tem 110k+ linhas)
  onProgress?.(4, TOTAL_ETAPAS, 'Carregando inscrições');
  const inscGrad = await loadInscPorDia('stg_rm_inscricoes_graduacao');
  const inscPos = await loadInscPorDia('stg_rm_inscricoes_pos');
  const inscMestrado = await loadInscPorDia('stg_rm_inscricoes_mestrado');
  const inscCL = await loadInscPorDia('stg_rm_inscricoes_cursoslivres');

  cachedDataset = {
    meta,
    google,
    rubeus,
    matGrad,
    matMestrado,
    matPos,
    matCL,
    inscGrad,
    inscPos,
    inscMestrado,
    inscCL,
    pletivo,
  };
  return cachedDataset;
}

async function loadPletivo(): Promise<RawPletivoRow[]> {
  const { data, error } = await supabase.from('pletivo').select('*').order('indice');
  if (error) throw error;
  return (data ?? []) as RawPletivoRow[];
}
