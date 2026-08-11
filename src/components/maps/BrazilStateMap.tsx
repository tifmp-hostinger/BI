import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BR_STATES, nameOf, type BrState } from '@/lib/brStates';
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
  const selectedRef = useRef<string | null>(selectedUf);
  // Callbacks em ref: as chamadoras passam funções inline (identidade nova a
  // cada render); como dependência de efeito elas DESTRUIRIAM e recriariam o
  // mapa inteiro em todo render (o cleanup do efeito de init chama
  // map.remove()) — perdendo zoom/pan do usuário e re-baixando tiles.
  const fnsRef = useRef({ secondaryLine, colorValue, onSelect });
  fnsRef.current = { secondaryLine, colorValue, onSelect };

  const byUf = useMemo(() => {
    const m = new Map<string, StateAgg>();
    for (const s of data) m.set(s.uf, s);
    return m;
  }, [data]);

  useEffect(() => {
    selectedRef.current = selectedUf;
  }, [selectedUf]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Toque grosso (celular/tablet): o arrasto de um dedo fica com a PÁGINA,
    // não com o mapa — antes o mapa em largura total sequestrava o scroll e o
    // usuário ficava preso dentro dele. Pinça continua dando zoom.
    const toqueGrosso =
      typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

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

    L.tileLayer(
      'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
      { subdomains: 'abcd', maxZoom: 19 }
    ).addTo(map);

    L.control
      .attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; OpenStreetMap &middot; CARTO')
      .addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on('click', () => fnsRef.current.onSelect(null));

    return () => {
      observador.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // Sem deps de callback: o mapa é criado UMA vez por montagem.
     
  }, []);

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

      const isSelected = selectedRef.current === s.uf;
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

      marker.addTo(layer);
    }
    // onSelect via fnsRef (identidade instável nas chamadoras).
     
  }, [byUf, data, metricLabel, metricFormat]);

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
