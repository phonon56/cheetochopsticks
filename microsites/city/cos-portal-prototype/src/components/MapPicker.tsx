import { useEffect, useRef, useState } from 'react';
import maplibregl, { type Map, type Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props {
  value: string; // "lat,lng" serialized, same convention as GovOutreach locationCoord
  onChange: (coord: string, address?: string) => void;
}

// Default: downtown Colorado Springs
const DEFAULT_CENTER: [number, number] = [-104.8214, 38.8339];
const DEFAULT_ZOOM = 12;

export function MapPicker({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const parsed = parseCoord(value);
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: parsed ? [parsed.lng, parsed.lat] : DEFAULT_CENTER,
      zoom: parsed ? 15 : DEFAULT_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-right',
    );

    map.on('click', (e) => {
      setPin(e.lngLat.lat, e.lngLat.lng);
    });

    mapRef.current = map;
    if (parsed) setPin(parsed.lat, parsed.lng, false);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setPin(lat: number, lng: number, recenter = true) {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: '#b91c1c', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current!.getLngLat();
        setPin(p.lat, p.lng, false);
      });
    } else {
      markerRef.current.setLngLat([lng, lat]);
    }
    if (recenter) map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15) });
    const coord = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    onChange(coord);
    // Best-effort reverse geocode (Nominatim). Rate-limited; OK for prototype.
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } },
      );
      if (res.ok) {
        const json = (await res.json()) as { display_name?: string };
        if (json.display_name) {
          onChange(coord, json.display_name);
          setAnnouncement(`Pin set at ${json.display_name}.`);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setAnnouncement(`Pin set at ${lat.toFixed(5)}, ${lng.toFixed(5)}.`);
  }

  function clearPin() {
    markerRef.current?.remove();
    markerRef.current = null;
    onChange('', '');
    setAnnouncement('Map pin cleared.');
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        role="application"
        aria-label="Map picker. Click anywhere on the map to drop a pin at that location. If you cannot use the map, type the address in the location field above."
        className="h-64 w-full rounded-md border border-slate-400 overflow-hidden"
      />
      <div className="flex items-center gap-3 text-xs text-slate-700">
        <button
          type="button"
          onClick={clearPin}
          disabled={!markerRef.current}
          className="rounded-md border border-slate-300 px-3 py-1 text-slate-800 hover:bg-slate-50 disabled:opacity-50 min-h-8"
        >
          Clear pin
        </button>
        <span>
          Map is optional — the address field above is authoritative. Not using a mouse?
          Type the address and skip the map.
        </span>
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}

function parseCoord(v: string): { lat: number; lng: number } | null {
  const m = v.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
