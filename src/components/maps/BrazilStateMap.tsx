import { useCallback, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BR_STATES, nameOf, type BrState } from '@/lib/brStates';
import { MALHA_UF, type PropsMalhaUf } from '@/lib/brasilMalha';
import type { StateAgg } from '@/services/matriculasService';

type Props = {
  data: StateAgg[];
  selectedUf: string | null;
  onSelect: (uf: string | null) => void;
  height?: number;
  /**
   * Rótulo da métrica principal no tooltip (o campo `total` do StateAgg).
   * Default 'matriculas' — o texto histórico do Presença Nacional.
   */
  metricLabel?: string;
  /** Formatação de `total` na bolha e no tooltip. Default 'int'. */
  metricFormat?: 'int' | 'currency';
  /**
   * Segunda linha do tooltip. Default: "Pos: N · Cursos livres: N", do
   * Presença Nacional. Retornar null omite a linha.
   */
  secondaryLine?: (agg: StateAgg) => string | null;
  /**
   * Valor que governa a INTENSIDADE de cor (bolha e mapa de calor), quando
   * ela deve ser diferente do tamanho. Default: o próprio `total`.
   */
  colorValue?: (agg: StateAgg) => number;
};

const FMP_SAND = '#BFBAA4';

/** Silhueta dos estados: contexto geográfico, nunca o dado. O valor continua
 *  só nas bolhas — pintar os estados por intensidade duplicaria a mesma
 *  métrica em duas codificações concorrentes (foi por isso que o mapa de calor
 *  saiu daqui). */
const MALHA_ESTILO = {
  color: '#CFCCBF', // line-2
  weight: 0.8,
  fillColor: '#FFFFFF',
  fillOpacity: 1,
} as const;

/**
 * Passagem do mouse: vermelho CLARO. É um convite ("dá para clicar aqui"), e
 * precisa ser distinguível do estado fixado quando os dois aparecem juntos —
 * um em vermelho claro e o outro em vermelho forte se leem de relance; dois
 * tons do mesmo vermelho, não.
 */
const MALHA_ESTILO_HOVER = {
  color: '#EE2A42',
  weight: 1.4,
  fillColor: '#FBD7DC', // fmp-light
  fillOpacity: 1,
} as const;

/** Estado fixado no clique: a própria forma acende, não só a bolha. */
const MALHA_ESTILO_SELECIONADO = {
  color: '#B81E32', // fmp-pressed
  weight: 2.4,
  fillColor: '#F9BAC2', // fmp-200
  fillOpacity: 1,
} as const;

/**
 * Estilo de uma UF a partir do estado atual. Seleção VENCE a passagem do
 * mouse: passar por cima do estado já fixado não deve rebaixá-lo para o tom
 * claro, que pareceria perda da seleção.
 */
function estiloDaUf(uf: string, selecionada: string | null, sobMouse: string | null) {
  if (uf === selecionada) return { ...MALHA_ESTILO_SELECIONADO };
  if (uf === sobMouse) return { ...MALHA_ESTILO_HOVER };
  return { ...MALHA_ESTILO };
}

/**
 * Ponteiro grosso (dedo) não tem "passar o mouse": o toque dispara mouseover e
 * NUNCA o mouseout correspondente, o que deixaria um estado aceso para sempre
 * ao lado do que foi realmente fixado — dois destaques, nenhum confiável.
 */
function ehToqueGrosso(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
}

/** Limites do Brasil: o enquadramento inicial mostra o país INTEIRO em
 * qualquer largura de tela — antes o zoom fixo 4 cortava o Nordeste no
 * celular e o usuário precisava arrastar para achar o próprio estado. */
const LIMITES_BRASIL = L.latLngBounds([-33.9, -74.1], [5.4, -34.6]);

function fmtMetric(v: number, format: 'int' | 'currency'): string {
  if (format === 'currency') {
    return v.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return v.toLocaleString('pt-BR');
}

function fmtBubble(v: number, format: 'int' | 'currency'): string {
  if (v <= 0) return '';
  if (format === 'currency') {
    if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
    return String(Math.round(v));
  }
  return v > 999 ? `${(v / 1000).toFixed(1)}k` : String(v);
}

function defaultSecondaryLine(agg: StateAgg): string {
  return `Pos: ${agg.pos} &middot; Cursos livres: ${agg.livres}`;
}

function interpolateSandToRed(t: number): string {
  const clamp = Math.max(0, Math.min(1, t));
  const from = { r: 0xBF, g: 0xBA, b: 0xA4 };
  const to = { r: 0xEE, g: 0x2A, b: 0x42 };
  const r = Math.round(from.r + (to.r - from.r) * clamp);
  const g = Math.round(from.g + (to.g - from.g) * clamp);
  const b = Math.round(from.b + (to.b - from.b) * clamp);
  return `rgb(${r},${g},${b})`;
}

export function BrazilStateMap({
  data,
  selectedUf,
  onSelect,
  height = 520,
  metricLabel = 'matriculas',
  metricFormat = 'int',
  secondaryLine = defaultSecondaryLine,
  colorValue,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const malhaRef = useRef<L.GeoJSON | null>(null);
  /** UF → polígono, para a bolha conseguir acender o estado embaixo dela. */
  const poligonosRef = useRef(new Map<string, L.Path>());
  /**
   * UF sob o mouse. Em REF, não em estado do React: hover muda a cada
   * movimento do mouse e como estado remontaria as 27 bolhas em cada um deles.
   * O realce é aplicado direto no Leaflet (setStyle), que é o que ele já faz
   * de melhor.
   */
  const sobMouseRef = useRef<string | null>(null);
  /**
   * Seleção espelhada em ref porque os handlers do Leaflet são criados UMA vez
   * (na montagem) e precisam do valor atual para decidir a cor ao sair do
   * mouse — uma closure sobre a prop enxergaria eternamente o valor inicial.
   */
  const selecionadoRef = useRef<string | null>(selectedUf);
  selecionadoRef.current = selectedUf;
  // Callbacks em ref: as chamadoras passam funções inline (identidade nova a
  // cada render); como dependência de efeito elas DESTRUIRIAM e recriariam o
  // mapa inteiro em todo render (o cleanup do efeito de init chama
  // map.remove()) — perdendo zoom/pan do usuário e remontando a malha.
  const fnsRef = useRef({ secondaryLine, colorValue, onSelect });
  fnsRef.current = { secondaryLine, colorValue, onSelect };

  /*
   * Os três abaixo são useCallback com dependência VAZIA de propósito: lêem
   * apenas refs, então a identidade estável é correta — e é o que permite que
   * eles entrem nas dependências dos efeitos sem recriar o mapa a cada render
   * (que é o problema descrito no comentário de fnsRef).
   */

  /** Repinta uma UF conforme seleção + mouse atuais. */
  const pinta = useCallback((uf: string) => {
    const poligono = poligonosRef.current.get(uf);
    if (!poligono) return;
    poligono.setStyle(estiloDaUf(uf, selecionadoRef.current, sobMouseRef.current));
    // Sem isto a borda acesa fica por baixo dos vizinhos desenhados depois e o
    // realce aparece cortado justamente nas divisas.
    if (uf === selecionadoRef.current || uf === sobMouseRef.current) poligono.bringToFront();
  }, []);

  /** Entrou o mouse numa UF (pelo polígono ou pela bolha em cima dele). */
  const entraMouse = useCallback(
    (uf: string) => {
      if (ehToqueGrosso()) return;
      const anterior = sobMouseRef.current;
      if (anterior === uf) return;
      sobMouseRef.current = uf;
      if (anterior) pinta(anterior);
      pinta(uf);
    },
    [pinta],
  );

  const saiMouse = useCallback(
    (uf: string) => {
      if (ehToqueGrosso()) return;
      if (sobMouseRef.current !== uf) return;
      sobMouseRef.current = null;
      pinta(uf);
    },
    [pinta],
  );

  const byUf = useMemo(() => {
    const m = new Map<string, StateAgg>();
    for (const s of data) m.set(s.uf, s);
    return m;
  }, [data]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Toque grosso (celular/tablet): o arrasto de um dedo fica com a PÁGINA,
    // não com o mapa — antes o mapa em largura total sequestrava o scroll e o
    // usuário ficava preso dentro dele. Pinça continua dando zoom.
    const toqueGrosso = ehToqueGrosso();

    const map = L.map(containerRef.current, {
      minZoom: 3,
      maxZoom: 8,
      // Roda do mouse volta a rolar a página; zoom pelos botões ou pinça.
      scrollWheelZoom: false,
      dragging: !toqueGrosso,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: false,
    });
    map.fitBounds(LIMITES_BRASIL, { padding: [8, 8] });

    // Reenquadra quando o container muda de largura (rotação do celular,
    // colapso do menu lateral) — center/zoom fixos não acompanham.
    const observador = new ResizeObserver(() => {
      map.invalidateSize();
      map.fitBounds(LIMITES_BRASIL, { padding: [8, 8] });
    });
    observador.observe(containerRef.current);

    // Silhueta dos estados a partir da malha embutida — ver lib/brasilMalha.ts
    // para o motivo de não haver mais camada de tiles (o basemap gratuito da
    // CARTO passou a exigir chave e quebrou o mapa em produção).
    poligonosRef.current.clear();
    const malha = L.geoJSON(MALHA_UF, {
      style: () => ({ ...MALHA_ESTILO }),
      onEachFeature: (feature, camada) => {
        const uf = (feature.properties as PropsMalhaUf | undefined)?.uf;
        if (!uf) return;
        poligonosRef.current.set(uf, camada as L.Path);

        // Clicar no ESTADO fixa a seleção, não só na bolha: a área do polígono
        // é muito maior que a bolha e é o que o usuário tenta acertar
        // primeiro, sobretudo no toque.
        camada.on('click', (e) => {
          L.DomEvent.stopPropagation(e as unknown as Event);
          fnsRef.current.onSelect(uf);
        });
        camada.on('mouseover', () => entraMouse(uf));
        camada.on('mouseout', () => saiMouse(uf));
      },
    }).addTo(map);
    malhaRef.current = malha;

    L.control
      .attribution({ position: 'bottomright', prefix: false })
      .addAttribution('Malha territorial: IBGE')
      .addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on('click', () => fnsRef.current.onSelect(null));

    // Cursor saiu do mapa: apaga o realce de passagem. Sem isto ele podia
    // ficar preso aceso — as bolhas são recriadas quando a seleção muda, e a
    // bolha destruída não dispara o mouseout dela. Ao clicar num estado e ir
    // para o painel lateral, o estado por onde o mouse passou continuaria
    // vermelho ao lado do que foi realmente fixado.
    map.on('mouseout', () => {
      const anterior = sobMouseRef.current;
      if (!anterior) return;
      sobMouseRef.current = null;
      pinta(anterior);
    });

    return () => {
      observador.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      malhaRef.current = null;
    };
    // O mapa é criado UMA vez por montagem: as únicas dependências são os
    // handlers de mouse, e eles têm identidade estável (useCallback acima).
  }, [entraMouse, saiMouse, pinta]);

  // Acende a forma do estado fixado. Efeito próprio, separado do desenho das
  // bolhas: selecionar não mexe nos dados, então repintar os polígonos é tudo
  // o que precisa acontecer.
  useEffect(() => {
    for (const uf of poligonosRef.current.keys()) pinta(uf);
  }, [selectedUf, pinta]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // Tamanho vem de `total`; a cor pode vir de outra métrica (colorValue).
    const { secondaryLine: linhaSecundaria, colorValue: corDe } = fnsRef.current;
    const sizeOf = (agg: StateAgg) => agg.total;
    const colorOf = corDe ?? sizeOf;

    // Max calculado de verdade (não assume que `data` chega ordenado).
    let max = 1;
    let maxColor = 1;
    for (const s of data) {
      if (sizeOf(s) > max) max = sizeOf(s);
      if (colorOf(s) > maxColor) maxColor = colorOf(s);
    }

    // Sem mapa de calor: a mancha (raio fixo em pixels de tela) vazava sobre
    // estados vizinhos sugerindo presença onde não há, e codificava a MESMA
    // métrica que a bolha já mostra em tamanho e cor — só ruído por cima.

    for (const s of BR_STATES) {
      const agg = byUf.get(s.uf);
      const total = agg?.total ?? 0;
      const corBase = agg ? colorOf(agg) : 0;
      const intensity =
        corBase <= 0
          ? 0
          : Math.max(0.2, Math.min(1, Math.log10(1 + corBase) / Math.log10(1 + maxColor)));
      const escala =
        total === 0 ? 0 : Math.max(0.2, Math.min(1, Math.log10(1 + total) / Math.log10(1 + max)));
      const color = total === 0 ? FMP_SAND : interpolateSandToRed(intensity);

      const isSelected = selectedUf === s.uf;
      const scale = total === 0 ? 0.35 : 0.4 + escala * 0.6;
      const size = Math.round(30 + scale * 30);

      const marker = L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          className: 'br-state-marker',
          html: renderBubble({
            state: s,
            label: fmtBubble(total, metricFormat),
            color,
            size,
            isSelected,
            hasData: total > 0,
          }),
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
      });

      const linha2 = agg ? linhaSecundaria(agg) : null;
      // Fonte e cores dos tokens do app (Outfit + escala ink) — o tooltip
      // antes usava Inter e a paleta slate, destoando dos tooltips recharts.
      marker.bindTooltip(
        `<div style="font-family:Outfit,sans-serif;">
          <div style="font-size:10px;color:#6E6B66;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">${s.region}</div>
          <div style="font-size:13px;font-weight:600;color:#191818;margin-top:2px;">${s.name} <span style="color:#6E6B66;font-weight:500;">(${s.uf})</span></div>
          <div style="font-size:12px;color:#B81E32;margin-top:4px;font-weight:600;">${fmtMetric(total, metricFormat)} ${metricLabel}</div>
          ${
            agg
              ? linha2
                ? `<div style="font-size:10px;color:#6E6B66;margin-top:2px;">${linha2}</div>`
                : ''
              : '<div style="font-size:10px;color:#6E6B66;margin-top:2px;">Sem dados</div>'
          }
        </div>`,
        { direction: 'top', offset: [0, -6], className: 'cep-tooltip' }
      );

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e as unknown as Event);
        fnsRef.current.onSelect(s.uf);
      });

      // A bolha fica EM CIMA do estado e come o mouseover do polígono. Sem
      // repassar, o miolo de cada estado — justamente onde o cursor vai —
      // seria uma área morta que não acende nada.
      marker.on('mouseover', () => entraMouse(s.uf));
      marker.on('mouseout', () => saiMouse(s.uf));

      marker.addTo(layer);
    }
    // onSelect via fnsRef (identidade instável nas chamadoras).
    //
    // `selectedUf` ENTRA nas dependências: o anel de seleção da bolha era lido
    // de um ref, e este efeito só rodava quando os dados mudavam — clicar num
    // estado não redesenhava as bolhas, então o anel só aparecia se por acaso
    // os dados mudassem junto. Redesenhar 27 divIcons é barato.

  }, [byUf, data, metricLabel, metricFormat, selectedUf, entraMouse, saiMouse]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-md ring-1 ring-inset ring-line"
      style={{ height }}
    />
  );
}

function renderBubble({
  state,
  label: valorLabel,
  color,
  size,
  isSelected,
  hasData,
}: {
  state: BrState;
  label: string;
  color: string;
  size: number;
  isSelected: boolean;
  hasData: boolean;
}) {
  const border = isSelected
    ? 'border: 3px solid #fff; box-shadow: 0 0 0 3px rgba(238,42,66,0.95), 0 16px 40px -12px rgba(184,30,50,0.55);'
    : hasData
    ? 'border: 2px solid rgba(255,255,255,0.9); box-shadow: 0 8px 20px -8px rgba(25,24,24,0.35);'
    : 'border: 2px dashed rgba(191,186,164,0.75); box-shadow: none;';

  const bg = hasData
    ? `background: radial-gradient(circle at 30% 25%, ${lighten(color)}, ${color});`
    : 'background: rgba(255,255,255,0.75);';

  // Texto ESCURO sobre a bolha: a rampa de cor vai de areia a vermelho, e
  // com texto branco o contraste ficava entre 2,4:1 (estados de pouco
  // volume) e 4,2:1 (o mais alto) — ilegível na maior parte do mapa. Em
  // tinta escura toda a rampa fica entre 5,1:1 e 7,3:1.
  const fontColor = hasData ? '#191818' : '#6E6B66';
  const fontSize = size > 46 ? 12 : size > 38 ? 11 : 10;
  const label = valorLabel || state.uf;

  return `
    <div style="
      position:relative;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:9999px;
      ${bg}
      ${border}
      transition:all 0.2s ease-out;
      font-family:Outfit,sans-serif;
    ">
      <span style="font-size:${fontSize}px;font-weight:700;color:${fontColor};line-height:1;">${label}</span>
      ${
        hasData
          ? `<span style="font-size:${Math.max(9, fontSize - 2)}px;color:rgba(25,24,24,0.72);font-weight:600;letter-spacing:0.06em;margin-top:1px;">${state.uf}</span>`
          : ''
      }
    </div>
  `;
}

function lighten(hex: string) {
  if (hex.startsWith('rgb')) {
    const parts = hex.match(/\d+/g);
    if (!parts) return hex;
    const [r, g, b] = parts.map(Number);
    const mix = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.45));
    return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
  }
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const mix = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.45));
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

export { nameOf };
