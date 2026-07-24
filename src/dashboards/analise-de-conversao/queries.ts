import { loadAllFrom, normalizeCodperlet } from '@/lib/supabasePaginate';
import { supabase } from '@/lib/supabase';
import type {
  DashboardDataset,
  RawInscricaoCursosLivesRow,
  RawInscricaoGradRow,
  RawInscricaoMestradoRow,
  RawInscricaoPosRow,
  RawMatriculaBolsaRow,
  RawMatriculaCursosLivesRow,
  RawMatriculaGradRow,
  RawMatriculaMestradoRow,
  RawMatriculaPosRow,
  RawMetaGraduacaoRow,
  RawMetaMestradoRow,
  RawMetaPosRow,
  RawPletivoRow,
  RawRubeusRow,
} from './types';

export async function fetchDashboardData(): Promise<DashboardDataset> {
  const [
    rubeus,
    matriculasGrad,
    inscricoesGrad,
    inscricoesPos,
    inscricoesMestrado,
    matriculasMestrado,
    matriculasPos,
    inscricoesCursosLives,
    matriculasCursosLives,
    matriculasBolsas,
  ] = await Promise.all([
    loadRubeus(),
    loadMatriculasGrad(),
    loadInscricoesGrad(),
    loadInscricoesPos(),
    loadInscricoesMestrado(),
    loadMatriculasMestrado(),
    loadMatriculasPos(),
    loadInscricoesCursosLives(),
    loadMatriculasCursosLives(),
    loadMatriculasBolsas(),
  ]);

  const [pletivo, metaGraduacao, metaMestrado, metaPos] = await Promise.all([
    loadPletivo(),
    loadMetaGraduacao(),
    loadMetaMestrado(),
    loadMetaPos(),
  ]);

  return {
    rubeus,
    matriculasGrad,
    inscricoesGrad,
    inscricoesPos,
    inscricoesMestrado,
    matriculasMestrado,
    matriculasPos,
    inscricoesCursosLives,
    matriculasCursosLives,
    matriculasBolsas,
    pletivo,
    metaGraduacao,
    metaMestrado,
    metaPos,
  };
}

async function loadRubeus(): Promise<RawRubeusRow[]> {
  const cols = 'momento_date,momento_ano,processo,pessoa_nome,canal_nome,etapa_nome';
  const rows = await loadAllFrom('rubeus_registros_personalizada', cols);
  return rows as RawRubeusRow[];
}

async function loadMatriculasGrad(): Promise<RawMatriculaGradRow[]> {
  const cols = 'ra,aluno,codperlet,situacao,tipomatricula,tipoingresso,datamatricula';
  const rows = await loadAllFrom('stg_rm_matriculas_grad', cols);
  return rows as RawMatriculaGradRow[];
}

async function loadInscricoesGrad(): Promise<RawInscricaoGradRow[]> {
  const cols = 'cpf,nome,areainteresse,processoseletivo,datainscricao,statusps';
  const rows = await loadAllFrom('stg_rm_inscricoes_graduacao', cols);
  return rows as RawInscricaoGradRow[];
}

async function loadInscricoesPos(): Promise<RawInscricaoPosRow[]> {
  const cols = 'cpf,processoseletivo,statusps,datainscricao';
  const rows = await loadAllFrom('stg_rm_inscricoes_pos', cols);
  return rows as RawInscricaoPosRow[];
}

async function loadInscricoesMestrado(): Promise<RawInscricaoMestradoRow[]> {
  const cols = 'cpf,nome,processoseletivo,datainscricao,statusps,periodo_letivo';
  try {
    const rows = await loadAllFrom('stg_rm_inscricoes_mestrado', cols);
    return rows as RawInscricaoMestradoRow[];
  } catch {
    const fallback = await loadAllFrom('stg_rm_inscricoes_mestrado', 'cpf,nome,processoseletivo,datainscricao,statusps');
    return fallback as RawInscricaoMestradoRow[];
  }
}

async function loadMatriculasMestrado(): Promise<RawMatriculaMestradoRow[]> {
  const cols = 'ra,aluno,codperlet,situacao,tipomatricula,datamatricula';
  const rows = await loadAllFrom('stg_rm_matriculas_mestrado', cols);
  return rows as RawMatriculaMestradoRow[];
}

async function loadMatriculasPos(): Promise<RawMatriculaPosRow[]> {
  const cols =
    'ra,aluno,curso,cursoreduzido,codperlet,situacao,descontoaluno,modalidadepos,distanciapresencial,bolsas,bolsa3,databaixa,datadematricula,datacancelamentomatricula,faturadobruto,codplanopgto,tcc,estado,processoseletivo';
  const rows = await loadAllFrom('stg_rm_matriculas_pos', cols);
  return rows as RawMatriculaPosRow[];
}

async function loadInscricoesCursosLives(): Promise<RawInscricaoCursosLivesRow[]> {
  const cols = 'numeroinscricao,situacao_matricula,datainscricao,curso,aluno';
  const rows = await loadAllFrom('stg_rm_inscricoes_cursoslivres', cols);
  return rows as RawInscricaoCursosLivesRow[];
}

async function loadMatriculasCursosLives(): Promise<RawMatriculaCursosLivesRow[]> {
  const cols = 'curso,situacao_matricula,valor_curso_com_desconto,data_contrato,aluno';
  const rows = await loadAllFrom('stg_rm_matriculas_cursoslivres', cols);
  return rows as RawMatriculaCursosLivesRow[];
}

async function loadMatriculasBolsas(): Promise<RawMatriculaBolsaRow[]> {
  const cols = 'ra,bolsa';
  const rows = await loadAllFrom('stg_rm_matriculas_bolsas', cols);
  return rows as RawMatriculaBolsaRow[];
}

async function loadPletivo(): Promise<RawPletivoRow[]> {
  const { data, error } = await supabase.from('pletivo').select('*').order('indice');
  if (error) throw error;
  return (data ?? []) as RawPletivoRow[];
}

async function loadMetaGraduacao(): Promise<RawMetaGraduacaoRow[]> {
  const { data, error } = await supabase.from('meta_graduacao').select('*');
  if (error) throw error;
  return (data ?? []) as RawMetaGraduacaoRow[];
}

async function loadMetaMestrado(): Promise<RawMetaMestradoRow[]> {
  const { data, error } = await supabase.from('meta_mestrado').select('*');
  if (error) throw error;
  return (data ?? []) as RawMetaMestradoRow[];
}

async function loadMetaPos(): Promise<RawMetaPosRow[]> {
  const { data, error } = await supabase.from('meta_pos').select('*');
  if (error) throw error;
  return (data ?? []) as RawMetaPosRow[];
}

export { normalizeCodperlet };
