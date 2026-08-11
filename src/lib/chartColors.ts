/**
 * Paleta categórica para pizza/rosca — 8 matizes com separação validada para
 * daltonismo (ΔE ≥ 8 CVD, ≥15 visão normal, ambos sobre fundo branco de
 * card). Antes, cada pizza do app definia seu próprio array local misturando
 * só vermelho e bege (FMP_RED/FMP_DARK/NEUTRAL), então toda fatia parecia a
 * mesma cor. Ordem fixa: nunca ciclar/reordenar por filtro, senão a cor de
 * uma categoria muda quando outra some do recorte.
 *
 * Funis continuam na cor vermelha da marca — esta paleta é só para
 * categorias lado a lado num pie/donut, não usar em funil.
 */
export const CORES_CATEGORICAS = [
  '#2a78d6', // azul
  '#eb6834', // laranja
  '#1baf7a', // verde-água
  '#eda100', // amarelo
  '#e87ba4', // magenta
  '#008300', // verde
  '#4a3aa7', // violeta
  '#e34948', // vermelho
] as const;

export function corCategorica(indice: number): string {
  return CORES_CATEGORICAS[indice % CORES_CATEGORICAS.length];
}

/**
 * Cores de série usadas em todos os gráficos recharts. Eram redeclaradas
 * localmente em 5 arquivos (com FMP_DARK apontando na verdade para o token
 * fmp.pressed) — um único ponto evita que os dashboards derivem entre si.
 */
export const FMP_RED = '#EE2A42';
export const FMP_DARK = '#B81E32';
export const NEUTRAL = '#BFBAA4';

/**
 * Estilo padrão do <Tooltip> recharts — antes copiado em 5 páginas via
 * função local chartTooltipStyle(). Objeto congelado, seguro de compartilhar.
 */
export const CHART_TOOLTIP = {
  contentStyle: {
    background: 'rgba(255,255,255,0.98)',
    border: '1px solid #DEDCD4',
    borderRadius: 12,
    boxShadow: '0 18px 40px rgba(25,24,24,0.12)',
    padding: 10,
    fontSize: 12,
  },
  labelStyle: {
    color: '#191818',
    fontWeight: 600,
    marginBottom: 4,
    fontSize: 12,
  },
  itemStyle: { color: '#3A3838', fontSize: 12 },
} as const;
