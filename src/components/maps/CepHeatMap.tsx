import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import type { UserCep } from '@/lib/supabase';

type Props = {
  points: UserCep[];
  height?: number;
};

export function CepHeatMap({ points, height = 480 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-15.235, -51.9253],
      zoom: 4,
      minZoom: 3,
      maxZoom: 12,
      scrollWheelZoom: true,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(
      'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    L.control
      .attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; OpenStreetMap &middot; CARTO')
      .addTo(map);

    mapRef.current = map;
    markerLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      heatLayerRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    if (markerLayerRef.current) {
      markerLayerRef.current.clearLayers();
    }

    if (points.length === 0) return;

    const heatPoints: [number, number, number][] = points.map((p) => [
      Number(p.latitude),
      Number(p.longitude),
      Math.max(0.3, Math.min(1, p.intensity / 5)),
    ]);

    const heat = (L as unknown as {
      heatLayer: (
        points: [number, number, number][],
        options?: Record<string, unknown>
      ) => L.Layer;
    }).heatLayer(heatPoints, {
      radius: 28,
      blur: 22,
      minOpacity: 0.35,
      maxZoom: 12,
      gradient: {
        0.2: '#E9D9C8',
        0.4: '#E8A79C',
        0.6: '#EE6474',
        0.8: '#EE2A42',
        1.0: '#B81E32',
      },
    });
    heat.addTo(map);
    heatLayerRef.current = heat;

    const cityMap = new Map<
      string,
      { lat: number; lng: number; count: number; city: string; state: string }
    >();
    for (const p of points) {
      const key = `${p.city}-${p.state}`;
      const existing = cityMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.lat = (existing.lat + Number(p.latitude)) / 2;
        existing.lng = (existing.lng + Number(p.longitude)) / 2;
      } else {
        cityMap.set(key, {
          lat: Number(p.latitude),
          lng: Number(p.longitude),
          count: 1,
          city: p.city,
          state: p.state,
        });
      }
    }

    const layer = markerLayerRef.current!;
    const sorted = Array.from(cityMap.values()).sort(
      (a, b) => b.count - a.count
    );
    const max = sorted[0]?.count ?? 1;

    for (const c of sorted.slice(0, 12)) {
      const scale = 0.35 + (c.count / max) * 0.65;
      const size = Math.round(28 + scale * 22);
      const marker = L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          className: '',
          html: `
            <div style="
              display:flex;align-items:center;justify-content:center;
              width:${size}px;height:${size}px;border-radius:9999px;
              background:linear-gradient(180deg,rgba(238,42,66,0.95),rgba(184,30,50,0.95));
              color:white;font-family:Inter,sans-serif;font-size:11px;font-weight:600;
              border:2px solid rgba(255,255,255,0.9);
              box-shadow:0 8px 20px -8px rgba(184,30,50,0.6);
            ">${c.count}</div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
      });
      marker.bindTooltip(
        `<div style="font-family:Inter,sans-serif;">
          <div style="font-size:11px;color:#64748B;">${c.state}</div>
          <div style="font-size:13px;font-weight:600;color:#0F172A;">${c.city}</div>
          <div style="font-size:11px;color:#B81E32;margin-top:2px;">${c.count} usuarios</div>
        </div>`,
        {
          direction: 'top',
          offset: [0, -6],
          className: 'cep-tooltip',
        }
      );
      marker.addTo(layer);
    }

    const bounds = L.latLngBounds(
      points.map((p) => [Number(p.latitude), Number(p.longitude)])
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.15), { animate: true });
    }
  }, [points]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-2xl ring-1 ring-inset ring-gray-200/70"
      style={{ height }}
    />
  );
}
