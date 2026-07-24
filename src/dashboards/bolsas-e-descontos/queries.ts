import { supabase } from '@/lib/supabase';
import type {
  BolsasFilters,
  ChartDatum,
  EvasaoPorAnoDatum,
  FilterOptions,
  PanoramaKpis,
} from './types';

type RpcParams = {
  p_codperlet: string | null;
  p_ano: number | null;
  p_tipocurso: string | null;
  p_bolsa_padronizada: string | null;
};

function toParams(filters: BolsasFilters): RpcParams {
  return {
    p_codperlet: filters.codperlet,
    p_ano: filters.ano,
    p_tipocurso: filters.tipocurso,
    p_bolsa_padronizada: filters.bolsaPadronizada,
  };
}

export async function fetchPanoramaKpis(filters: BolsasFilters): Promise<PanoramaKpis> {
  const { data, error } = await supabase.rpc('rpc_bolsas_panorama_kpis', toParams(filters));
  if (error) throw error;
  if (!data || data.length === 0) {
    return {
      matriculas: 0, bolsas: 0, descontos: 0, formados: 0,
      fatOriginalPrevisto: 0, fatDescontoPrevisto: 0,
      matricCancelado: 0, matricEvadido: 0, matricTransferencia: 0,
      evasaoBolsas: 0, fatDescontoMatriculado: 0, matBeneFin: 0,
      renunciaValorEvasao: 0,
    };
  }
  const r = data[0] as Record<string, unknown>;
  return {
    matriculas: Number(r.matriculas) || 0,
    bolsas: Number(r.bolsas) || 0,
    descontos: Number(r.descontos) || 0,
    formados: Number(r.formados) || 0,
    fatOriginalPrevisto: Number(r.fat_original_previsto) || 0,
    fatDescontoPrevisto: Number(r.fat_desconto_previsto) || 0,
    matricCancelado: Number(r.matric_cancelado) || 0,
    matricEvadido: Number(r.matric_evadido) || 0,
    matricTransferencia: Number(r.matric_transferencia) || 0,
    evasaoBolsas: Number(r.evasao_bolsas) || 0,
    fatDescontoMatriculado: Number(r.fat_desconto_matriculado) || 0,
    matBeneFin: Number(r.mat_bene_fin) || 0,
    renunciaValorEvasao: Number(r.renuncia_valor_evasao) || 0,
  };
}

export async function fetchTopDescontos(filters: BolsasFilters): Promise<ChartDatum[]> {
  const { data, error } = await supabase.rpc('rpc_bolsas_top_descontos', toParams(filters));
  if (error) throw error;
  return ((data ?? []) as Array<{ categoria: string; valor: number }>).map((r) => ({
    categoria: r.categoria,
    valor: Number(r.valor) || 0,
  }));
}

export async function fetchOcorrenciasBolsa(filters: BolsasFilters): Promise<ChartDatum[]> {
  const { data, error } = await supabase.rpc('rpc_bolsas_ocorrencias_bolsa', toParams(filters));
  if (error) throw error;
  return ((data ?? []) as Array<{ categoria: string; valor: number }>).map((r) => ({
    categoria: r.categoria,
    valor: Number(r.valor) || 0,
  }));
}

export async function fetchDistribuicaoBeneficios(filters: BolsasFilters): Promise<ChartDatum[]> {
  const { data, error } = await supabase.rpc('rpc_bolsas_distribuicao_beneficios', toParams(filters));
  if (error) throw error;
  return ((data ?? []) as Array<{ categoria: string; valor: number }>).map((r) => ({
    categoria: r.categoria,
    valor: Number(r.valor) || 0,
  }));
}

export async function fetchTopCursosFaturamento(filters: BolsasFilters): Promise<ChartDatum[]> {
  const { data, error } = await supabase.rpc('rpc_bolsas_top_cursos_faturamento', toParams(filters));
  if (error) throw error;
  return ((data ?? []) as Array<{ categoria: string; valor: number }>).map((r) => ({
    categoria: r.categoria,
    valor: Number(r.valor) || 0,
  }));
}

export async function fetchEvasaoBeneficios(filters: BolsasFilters): Promise<ChartDatum[]> {
  const { data, error } = await supabase.rpc('rpc_bolsas_evasao_beneficios', toParams(filters));
  if (error) throw error;
  return ((data ?? []) as Array<{ categoria: string; valor: number }>).map((r) => ({
    categoria: r.categoria,
    valor: Number(r.valor) || 0,
  }));
}

export async function fetchEvasaoPorAno(
  tipocurso: string | null,
  bolsaPadronizada: string | null
): Promise<EvasaoPorAnoDatum[]> {
  const { data, error } = await supabase.rpc('rpc_bolsas_evasao_por_ano', {
    p_tipocurso: tipocurso,
    p_bolsa_padronizada: bolsaPadronizada,
  });
  if (error) throw error;
  return ((data ?? []) as Array<{ ano: number; mat_bene_fin: number; evasao_bolsas: number }>).map((r) => ({
    ano: Number(r.ano) || 0,
    matBeneFin: Number(r.mat_bene_fin) || 0,
    evasaoBolsas: Number(r.evasao_bolsas) || 0,
  }));
}

export async function fetchEvasaoPorModalidade(filters: BolsasFilters): Promise<ChartDatum[]> {
  const { data, error } = await supabase.rpc('rpc_bolsas_evasao_por_modalidade', toParams(filters));
  if (error) throw error;
  return ((data ?? []) as Array<{ categoria: string; valor: number }>).map((r) => ({
    categoria: r.categoria,
    valor: Number(r.valor) || 0,
  }));
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const { data, error } = await supabase.rpc('rpc_bolsas_filter_options');
  if (error) throw error;
  if (!data || data.length === 0) {
    return { codperletOptions: [], anoOptions: [], tipocursoOptions: [], bolsaPadronizadaOptions: [] };
  }
  const r = data[0] as Record<string, unknown[]>;
  return {
    codperletOptions: (r.codperlet_options as string[]) ?? [],
    anoOptions: (r.ano_options as number[]) ?? [],
    tipocursoOptions: (r.tipocurso_options as string[]) ?? [],
    bolsaPadronizadaOptions: (r.bolsa_padronizada_options as string[]) ?? [],
  };
}
