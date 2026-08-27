import type { GeoJsonObject } from 'geojson';
import bruta from '@/lib/brasilMalhaUf.json';

/**
 * Malha territorial das 27 UFs, EMBUTIDA no bundle.
 *
 * Por que não vem de um serviço de tiles: o mapa usava o endpoint gratuito
 * legado da CARTO (`cartodb-basemaps-{s}.global.ssl.fastly.net`), que passou a
 * exigir chave de API. Da noite para o dia todo tile virou uma imagem com a
 * marca d'água "API KEY REQUIRED" atravessada, em produção, sem nenhuma
 * mudança do nosso lado — e é assim que termina qualquer basemap gratuito de
 * terceiro: o dono muda a política e o painel quebra sozinho.
 *
 * Trocar de provedor só adiaria o problema (e os que restam sem chave têm
 * política de uso que não cobre aplicação institucional em produção). Assinar
 * a CARTO colocaria mais uma credencial no bundle público — num app só de
 * frontend não existe valor secreto — para renovar e vigiar.
 *
 * A geometria do Brasil não muda: cabe no bundle. Sem rede, sem chave, sem
 * terceiro no caminho, funciona atrás de qualquer proxy corporativo e o
 * desenho fica na paleta do app em vez do cinza da CARTO — junto com os
 * rótulos de países vizinhos, que num dado 100% brasileiro eram só ruído.
 *
 * ---------------------------------------------------------------------------
 * Origem e como regerar
 *
 * Fonte: malha das UFs do IBGE, via github.com/giuliano-macedo/geodata-br-states
 * (MIT). O arquivo original tem 5,6 MB em precisão total; aqui está simplificado
 * para 176 KB (~48 KB gzip), o que é fiel de sobra para o zoom máximo 8 deste
 * mapa. Para regerar:
 *
 *   npm i -g mapshaper
 *   curl -o uf.json https://raw.githubusercontent.com/giuliano-macedo/\
 *     geodata-br-states/main/geojson/br_states.json
 *   mapshaper uf.json -filter-islands min-area=500km2 remove-empty \
 *     -simplify interval=10km keep-shapes -o precision=0.001 \
 *     format=geojson brasil-uf.json
 *
 * E então reduza cada feature a `{ properties: { uf }, geometry }` — as
 * propriedades do arquivo de origem carregam dados de censo (população,
 * alfabetização) que não têm uso aqui e só pesariam no bundle.
 *
 * `-simplify` do mapshaper preserva TOPOLOGIA: fronteiras compartilhadas são
 * simplificadas de forma idêntica nos dois estados. Simplificar cada polígono
 * isoladamente abriria fendas visíveis entre estados vizinhos.
 *
 * As 27 siglas foram conferidas contra `BR_STATES` (lib/brStates.ts) na
 * geração — o mapa depende dessa correspondência para casar a seleção.
 */
export const MALHA_UF = bruta as unknown as GeoJsonObject;

/** Propriedades que sobreviveram à redução: só a sigla da UF. */
export type PropsMalhaUf = { uf: string };
