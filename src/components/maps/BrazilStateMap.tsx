import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { BR_STATES, nameOf, type BrState } from '@/lib/brStates';
import type { StateAgg } from '@/services/matriculasService';

type Props = {
  data: StateAgg[];
  selectedUf: string | null;
  onSelect: (uf: string | null) => void;
  height?: number;
};

const REGION_COLOR: Record<string, string> = {
  Sul: '#2E5AAC',
  Sudeste: '#0EA5E9',
  Nordeste: '#16A34A',
  'Centro-Oeste': '#D97706',
  Norte: '#DC2626',
};

export function BrazilStateMap({
  data,
  selectedUf,
  onSelect,
  height = 520,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const heatRef = useRef<L.Layer | null>(null);
  const selectedRef = useRef<string | null>(selectedUf);

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

    const map = L.map(containerRef.current, {
      center: [-14.5, -52],
      zoom: 4,
      minZoom: 3,
      maxZoom: 8,
      scrollWheelZoom: true,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: false,
    });

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

    map.on('click', () => onSelect(null));

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      heatRef.current = null;
    };
  }, [onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }

    const max = data[0]?.total ?? 1;

    const heatPoints: [number, number, number][] = BR_STATES.filter(
      (s) => (byUf.get(s.uf)?.total ?? 0) > 0
    ).map((s) => {
      const agg = byUf.get(s.uf)!;
      const norm = Math.max(0.25, Math.min(1, Math.log10(1 + agg.total) / Math.log10(1 + max)));
      return [s.lat, s.lng, norm];
    });

    if (heatPoints.length > 0) {
      const heat = (L as unknown as {
        heatLayer: (
          points: [number, number, number][],
          options?: Record<string, unknown>
        ) => L.Layer;
      }).heatLayer(heatPoints, {
        radius: 55,
        blur: 45,
        minOpacity: 0.35,
        maxZoom: 8,
        gradient: {
          0.2: '#4A78D1',
          0.4: '#0EA5E9',
          0.6: '#16A34A',
          0.75: '#D97706',
          0.9: '#DC2626',
        },
      });
      heat.addTo(map);
      heatRef.current = heat;
    }

    for (const s of BR_STATES) {
      const agg = byUf.get(s.uf);
      const total = agg?.total ?? 0;
      const color = REGION_COLOR[s.region] ?? '#2E5AAC';

      const isSelected = selectedRef.current === s.uf;
      const scale = total === 0 ? 0.35 : 0.4 + Math.min(1, Math.log10(1 + total) / Math.log10(1 + max)) * 0.6;
      const size = Math.round(30 + scale * 30);

      const marker = L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          className: 'br-state-marker',
          html: renderBubble({ state: s, total, color, size, isSelected, hasData: total > 0 }),
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
      });

      marker.bindTooltip(
        `<div style="font-family:Inter,sans-serif;">
          <div style="font-size:10px;color:#64748B;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">${s.region}</div>
          <div style="font-size:13px;font-weight:600;color:#0F172A;margin-top:2px;">${s.name} <span style="color:#94A3B8;font-weight:500;">(${s.uf})</span></div>
          <div style="font-size:12px;color:#2E5AAC;margin-top:4px;font-weight:600;">${total.toLocaleString('pt-BR')} matriculas</div>
          ${
            agg
              ? `<div style="font-size:10px;color:#64748B;margin-top:2px;">Pos: ${agg.pos} &middot; Cursos livres: ${agg.livres}</div>`
              : '<div style="font-size:10px;color:#94A3B8;margin-top:2px;">Sem dados</div>'
          }
        </div>`,
        { direction: 'top', offset: [0, -6], className: 'cep-tooltip' }
      );

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e as unknown as Event);
        onSelect(s.uf);
      });

      marker.addTo(layer);
    }
  }, [byUf, data, onSelect]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-2xl ring-1 ring-inset ring-gray-200/70"
      style={{ height }}
    />
  );
}

function renderBubble({
  state,
  total,
  color,
  size,
  isSelected,
  hasData,
}: {
  state: BrState;
  total: number;
  color: string;
  size: number;
  isSelected: boolean;
  hasData: boolean;
}) {
  const border = isSelected
    ? 'border: 3px solid #fff; box-shadow: 0 0 0 3px rgba(46,90,172,0.95), 0 16px 40px -12px rgba(46,90,172,0.65);'
    : hasData
    ? 'border: 2px solid rgba(255,255,255,0.9); box-shadow: 0 8px 20px -8px rgba(15,23,42,0.4);'
    : 'border: 2px dashed rgba(148,163,184,0.7); box-shadow: none;';

  const bg = hasData
    ? `background: radial-gradient(circle at 30% 25%, ${lighten(color)}, ${color});`
    : 'background: rgba(255,255,255,0.75);';

  const fontColor = hasData ? '#ffffff' : '#94A3B8';
  const fontSize = size > 46 ? 12 : size > 38 ? 11 : 10;
  const label = total > 999 ? `${(total / 1000).toFixed(1)}k` : total > 0 ? total : state.uf;

  return `
    <div style="
      position:relative;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:9999px;
      ${bg}
      ${border}
      transition:all 0.2s ease-out;
      font-family:Inter,sans-serif;
    ">
      <span style="font-size:${fontSize}px;font-weight:700;color:${fontColor};line-height:1;">${label}</span>
      ${
        hasData
          ? `<span style="font-size:${Math.max(8, fontSize - 2)}px;color:rgba(255,255,255,0.75);font-weight:500;letter-spacing:0.06em;margin-top:1px;">${state.uf}</span>`
          : ''
      }
    </div>
  `;
}

function lighten(hex: string) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const mix = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.45));
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

export { nameOf };
