/**
 * Exportação CSV feita para o destino real: Excel em português.
 *
 * - Separador `;` — o Excel pt-BR trata `,` como decimal e abriria tudo numa
 *   coluna só.
 * - BOM UTF-8 — sem ele o Excel lê os acentos como Ã© / Ã§.
 * - Célula entre aspas quando contém separador, aspas ou quebra de linha;
 *   aspas internas duplicadas (RFC 4180).
 * - Números saem com vírgula decimal, sem separador de milhar: é o formato
 *   que o Excel pt-BR reconhece como número, não como texto.
 */

function celula(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s: string;
  if (typeof v === 'number') {
    s = Number.isInteger(v) ? String(v) : String(v).replace('.', ',');
  } else {
    s = String(v);
  }
  if (/[";\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function linhasParaCsv(linhas: Record<string, unknown>[], colunas: string[]): string {
  const cab = colunas.map(celula).join(';');
  const corpo = linhas.map((l) => colunas.map((c) => celula(l[c])).join(';'));
  return [cab, ...corpo].join('\r\n');
}

/** Dispara o download de um CSV no navegador. */
export function baixarCsv(nomeArquivo: string, linhas: Record<string, unknown>[], colunas: string[]): void {
  const csv = '﻿' + linhasParaCsv(linhas, colunas);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo.endsWith('.csv') ? nomeArquivo : `${nomeArquivo}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revogação adiada: revogar de imediato cancela o download em alguns navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
