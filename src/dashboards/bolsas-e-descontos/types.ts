export type PanoramaKpis = {
  matriculas: number;
  bolsas: number;
  descontos: number;
  formados: number;
  fatOriginalPrevisto: number;
  fatDescontoPrevisto: number;
  matricCancelado: number;
  matricEvadido: number;
  matricTransferencia: number;
  evasaoBolsas: number;
  fatDescontoMatriculado: number;
  matBeneFin: number;
  renunciaValorEvasao: number;
};

export type ChartDatum = {
  categoria: string;
  valor: number;
};

export type EvasaoPorAnoDatum = {
  ano: number;
  matBeneFin: number;
  evasaoBolsas: number;
};

export type FilterOptions = {
  codperletOptions: string[];
  anoOptions: number[];
  tipocursoOptions: string[];
  bolsaPadronizadaOptions: string[];
};

export type BolsasFilters = {
  codperlet: string | null;
  ano: number | null;
  tipocurso: string | null;
  bolsaPadronizada: string | null;
};
