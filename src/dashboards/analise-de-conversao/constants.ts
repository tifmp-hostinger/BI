const MESES_PT = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export const ANOS = [2024, 2025, 2026];

export function buildCalendar(): import('./types').CalendarEntry[] {
  const out: import('./types').CalendarEntry[] = [];
  for (const ano of ANOS) {
    for (let mes = 1; mes <= 12; mes++) {
      const date = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const ordemFiscal = mes >= 11 ? mes - 10 : mes + 2;
      out.push({
        date,
        ano,
        mes,
        mesNome: MESES_PT[mes - 1],
        ordemFiscal,
      });
    }
  }
  return out;
}

export const CALENDAR = buildCalendar();

export const MES_OPTIONS = CALENDAR.filter((c) => c.ano === 2025).map((c) => ({
  numero: c.mes,
  nome: c.mesNome,
}));

export function fiscalLabel(ano: number, mes: number): string {
  const nome = MESES_PT[mes - 1];
  return `${ano} ${nome}`;
}

export function fiscalSortKey(ano: number, mes: number): number {
  return ano * 100 + (mes >= 11 ? mes - 10 : mes + 2);
}
