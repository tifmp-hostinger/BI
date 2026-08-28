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
  // Passos CLAREADOS para o fundo escuro (tema SaaS): os originais foram
  // validados sobre card branco; sobre #17151A os mais escuros (verde #008300,
  // violeta #4a3aa7) caíam abaixo do contraste útil. Mesmos matizes, mesma
  // ordem fixa — cor continua seguindo a entidade.
  '#5B9BE8', // azul
  '#F0824E', // laranja
  '#2FC48E', // verde-água
  '#F5B33E', // amarelo
  '#F095B8', // magenta
  '#4CBB4C', // verde
  '#8A78E0', // violeta
  '#F0616F', // vermelho
] as const;

export function corCategorica(indice: number): string {
  return CORES_CATEGORICAS[indice % CORES_CATEGORICAS.length];
}

/**
 * Cores de série usadas em todos os gráficos recharts. Eram redeclaradas
 * localmente em 5 arquivos (com FMP_DARK apontando na verdade para o token
 * fmp.pressed) — um único ponto evita que os dashboards derivem entre si.
 */
// Vermelhos de série clareados para o escuro; NEUTRAL (areia) já é claro.
export const FMP_RED = '#FF4D63';
export const FMP_DARK = '#E23B52';
export const NEUTRAL = '#BFBAA4';

/**
 * Estilo padrão do <Tooltip> recharts — antes copiado em 5 páginas via
 * função local chartTooltipStyle(). Objeto congelado, seguro de compartilhar.
 */
export const CHART_TOOLTIP = {
  contentStyle: {
    background: 'rgba(29,26,32,0.98)',
    border: '1px solid #3A3641',
    borderRadius: 12,
    boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
    padding: 10,
    fontSize: 12,
  },
  labelStyle: {
    color: '#F2EFEA',
    fontWeight: 600,
    marginBottom: 4,
    fontSize: 12,
  },
  itemStyle: { color: '#C9C5BE', fontSize: 12 },
} as const;
