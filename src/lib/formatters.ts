/**
 * Formatação numérica pt-BR compartilhada por todos os dashboards.
 *
 * Antes, fmtInt/fmtBRL/fmtBRLCompact/truncateLabel existiam copiados em três
 * dashboards (analise-de-conversao, bolsas-e-descontos, presidencia) e o
 * Growth importava de outro dashboard — além de dois fmtBRL locais em
 * Presença Nacional com sufixos divergentes ("M"/"k" vs "mi"/"mil"). Um
 * número da FMP deve ler igual em qualquer tela.
 */

export function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return Math.round(v).toLocaleString('pt-BR');
}

/**
 * Inteiro compacto para cards estreitos: 1.234.567 -> "1,23 mi",
 * 123.456 -> "123,5 mil". Abaixo de 10 mil o número cheio já é curto.
 */
export function fmtIntCompact(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  // Limiar 999.950 (não 1 mi): entre 999.950 e 999.999 o ramo "mil" com 1
  // casa arredondaria para o absurdo "1.000,0 mil".
  if (abs >= 999_950) {
    return `${(v / 1_000_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} mi`;
  }
  if (abs >= 10_000) {
    return `${(v / 1_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} mil`;
  }
  return Math.round(v).toLocaleString('pt-BR');
}

export function fmtBRL(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  });
}

/** Compacta valores altos: 800000 -> "R$ 800 mil", 1600000 -> "R$ 1,60 mi". */
export function fmtBRLCompact(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  // Limiar 999.500 (não 1 mi): entre 999.500 e 999.999 o ramo "mil" com 0
  // casas arredondaria para "R$ 1.000 mil".
  if (abs >= 999_500) {
    return `R$ ${(v / 1_000_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} mi`;
  }
  if (abs >= 1_000) {
    return `R$ ${(v / 1_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} mil`;
  }
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  });
}

/** Percentual sobre fração 0-1 com 1 casa: 0.745 -> "74,5%". */
export function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return `${(v * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

/** Razão com sufixo multiplicador: 2.5 -> "2,50x" (ROAS, frequência). */
export function fmtRatio(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return `${v.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}x`;
}

export function truncateLabel(s: string, max = 28): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

/** Código de período do RM legível: "26-01" -> "2026/1". */
export function formatPeriodoLetivo(codperlet: string): string {
  const m = codperlet.match(/^(\d{2})-0?([12])$/);
  if (!m) return codperlet;
  return `20${m[1]}/${m[2]}`;
}
