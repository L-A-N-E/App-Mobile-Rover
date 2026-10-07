import { config } from './config.js';

// Coordenadas reais via OpenStreetMap (Nominatim). As coordenadas do modelo são só
// estimativas, e o otimizador de rotas do app precisa de posições confiáveis.
// Política do Nominatim: no máximo 1 requisição por segundo e User-Agent identificável.

type LatLng = { lat: number; lng: number };

// found: lugar existe | not_found: não existe no mapa (provável invenção do modelo) | unavailable: sem internet/desligado
export type GeocodeResult = { status: 'found'; position: LatLng } | { status: 'not_found' } | { status: 'unavailable' };

const cache = new Map<string, GeocodeResult>();
let lastRequest = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function distanceKm(a: LatLng, b: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Busca pelo nome do lugar dentro de uma caixa de ~60 km ao redor da cidade.
export async function geocode(query: string, near: LatLng): Promise<GeocodeResult> {
  if (!config.geocoding) return { status: 'unavailable' };
  const key = query.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const wait = 1100 - (Date.now() - lastRequest);
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    const d = 0.5;
    url.searchParams.set('viewbox', `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`);
    url.searchParams.set('bounded', '1');

    const res = await fetch(url, {
      headers: { 'User-Agent': 'RoverTravelPlanner/1.0 (projeto academico)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn(`[geocode] Nominatim respondeu ${res.status}`);
      return { status: 'unavailable' };
    }
    const results = (await res.json()) as { lat: string; lon: string }[];
    const result: GeocodeResult = results[0]
      ? { status: 'found', position: { lat: Number(results[0].lat), lng: Number(results[0].lon) } }
      : { status: 'not_found' };
    cache.set(key, result);
    return result;
  } catch (err) {
    console.warn('[geocode] falhou:', (err as Error).message);
    return { status: 'unavailable' }; // sem internet: o chamador usa a estimativa do modelo
  }
}
