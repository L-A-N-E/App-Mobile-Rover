import { getPlace, Place } from '../data/catalog';
import { getLanguage } from '../i18n';

// Otimização de rotas sobre um grafo completo (pontos = vértices, distâncias = pesos):
// heurística do vizinho mais próximo seguida de melhoria 2-opt.

const EARTH_RADIUS_KM = 6371;
const AVG_CITY_SPEED_KMH = 14; // média entre caminhada e transporte público
const DAY_START_MIN = 9 * 60;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distanceKm(a: Place, b: Place) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export const travelMinutes = (km: number) => Math.max(5, Math.round((km / AVG_CITY_SPEED_KMH) * 60));

const resolve = (ids: string[]) => ids.map(getPlace).filter((pl): pl is Place => Boolean(pl));

export function routeDistance(ids: string[]) {
  const pts = resolve(ids);
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) total += distanceKm(pts[i], pts[i + 1]);
  return total;
}

// Paradas de vida noturna ficam sempre no fim do dia; o restante é otimizado normalmente.
export function optimizeRoute(ids: string[]): string[] {
  const pts = resolve(ids);
  const day = pts.filter((pl) => pl.category !== 'Vida Noturna').map((pl) => pl.id);
  const night = pts.filter((pl) => pl.category === 'Vida Noturna').map((pl) => pl.id);
  if (!night.length) return shortestPath(day);
  if (!day.length) return shortestPath(night);
  const dayRoute = shortestPath(day);
  // a noite parte da última parada do dia
  const nightRoute = shortestPath([dayRoute[dayRoute.length - 1], ...night]).slice(1);
  return [...dayRoute, ...nightRoute];
}

function shortestPath(ids: string[]): string[] {
  const pts = resolve(ids);
  if (pts.length < 3) return ids;

  // 1) Vizinho mais próximo, mantendo a primeira parada como ponto de partida
  const remaining = pts.slice(1);
  const route: Place[] = [pts[0]];
  while (remaining.length) {
    const last = route[route.length - 1];
    let best = 0;
    for (let i = 1; i < remaining.length; i++) {
      if (distanceKm(last, remaining[i]) < distanceKm(last, remaining[best])) best = i;
    }
    route.push(remaining.splice(best, 1)[0]);
  }

  // 2) 2-opt: inverte trechos enquanto houver ganho
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 2; i++) {
      for (let k = i + 1; k < route.length - 1; k++) {
        const before = distanceKm(route[i - 1], route[i]) + distanceKm(route[k], route[k + 1]);
        const after = distanceKm(route[i - 1], route[k]) + distanceKm(route[i], route[k + 1]);
        if (after + 1e-9 < before) {
          route.splice(i, k - i + 1, ...route.slice(i, k + 1).reverse());
          improved = true;
        }
      }
    }
  }

  return route.map((pl) => pl.id);
}

export type ScheduledStop = {
  place: Place;
  start: number;
  end: number;
  toNextKm?: number;
  toNextMin?: number;
  fixed?: boolean; // horário escolhido pelo usuário
  conflict?: boolean; // horário fixo começa antes de dar tempo de chegar da parada anterior
};

// Horários fixos por parada (minutos desde 00:00). Sem horário fixo, a parada começa
// assim que dá para chegar da anterior; o dia começa às 09:00.
export type StopTimes = Record<string, number>;

export function buildSchedule(ids: string[], times: StopTimes = {}): ScheduledStop[] {
  const pts = resolve(ids);
  let clock = DAY_START_MIN;
  return pts.map((place, i) => {
    const fixedStart = times[place.id];
    const fixed = fixedStart !== undefined;
    const start = fixed ? fixedStart : clock;
    const conflict = fixed && i > 0 && fixedStart < clock;
    const end = start + place.durationMin;
    const next = pts[i + 1];
    const toNextKm = next ? distanceKm(place, next) : undefined;
    const toNextMin = toNextKm !== undefined ? travelMinutes(toNextKm) : undefined;
    clock = end + (toNextMin ?? 0);
    return { place, start, end, toNextKm, toNextMin, fixed, conflict };
  });
}

export const formatClock = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const formatDecimal = (value: number, digits = 1) => {
  const text = value.toFixed(digits);
  return getLanguage() === 'en' ? text : text.replace('.', ',');
};

export const formatKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${formatDecimal(km)} km`);

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
};

// Distribui pontos entre os dias e otimiza cada dia.
export function planItinerary(placeIds: string[], days: number): string[][] {
  const ordered = optimizeRoute(placeIds);
  const perDay = Math.ceil(ordered.length / days);
  return Array.from({ length: days }, (_, d) => optimizeRoute(ordered.slice(d * perDay, (d + 1) * perDay)));
}
