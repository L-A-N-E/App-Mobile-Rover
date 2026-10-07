import { Trip } from '../contexts/TripsContext';
import { t } from '../i18n';
import { getPlace, getPlacesByCity, isOutdoor, Place } from '../data/catalog';
import { DayWeather, Forecast, HourWeather } from '../services/weather';
import { addDaysISO } from './dates';
import { buildSchedule, distanceKm, StopTimes } from './route';

// Cruza o roteiro com a previsão: só atividades ao ar livre são afetadas pelo clima.

export type ImpactReason = 'storm' | 'rain' | 'snow' | 'heat' | 'cold' | 'wind';

export type StopImpact = {
  dayIndex: number;
  date: string;
  placeId: string;
  placeName: string;
  reason: ImpactReason;
  severity: 'alerta' | 'atencao';
  hour: number; // hora mais crítica dentro da visita
  detail: string; // ex.: "Chuva 80% às 15h"
};

const THRESHOLDS = {
  rainProb: 50, // %
  rainMm: 0.5, // mm na hora
  heat: 35, // °C
  cold: 0, // °C
  wind: 45, // km/h
};

export const reasonLabel = (reason: ImpactReason) => t(`reason.${reason}`);

const isStorm = (h: HourWeather) => h.code >= 95;
const isSnow = (h: HourWeather) => (h.code >= 71 && h.code <= 77) || h.code === 85 || h.code === 86;
const isRain = (h: HourWeather) =>
  h.precipProb >= THRESHOLDS.rainProb || h.precip >= THRESHOLDS.rainMm || (h.code >= 61 && h.code <= 67) || (h.code >= 80 && h.code <= 82);

// Pior condição dentro das horas da visita (ordem de gravidade).
function worstCondition(hours: HourWeather[]): { reason: ImpactReason; hour: HourWeather } | null {
  const checks: [ImpactReason, (h: HourWeather) => boolean][] = [
    ['storm', isStorm],
    ['snow', isSnow],
    ['rain', isRain],
    ['wind', (h) => h.wind >= THRESHOLDS.wind],
    ['heat', (h) => h.temp >= THRESHOLDS.heat],
    ['cold', (h) => h.temp <= THRESHOLDS.cold],
  ];
  for (const [reason, test] of checks) {
    const hit = hours.filter(test);
    if (hit.length) {
      const hour = reason === 'rain' ? hit.reduce((a, b) => (b.precipProb > a.precipProb ? b : a)) : hit[0];
      return { reason, hour };
    }
  }
  return null;
}

function describe(reason: ImpactReason, h: HourWeather) {
  const hour = String(h.hour).padStart(2, '0');
  switch (reason) {
    case 'rain':
      return t('impact.rain', { prob: Math.round(h.precipProb), hour });
    case 'storm':
      return t('impact.storm', { hour });
    case 'snow':
      return t('impact.snow', { hour });
    case 'wind':
      return t('impact.wind', { speed: Math.round(h.wind), hour });
    case 'heat':
    case 'cold':
      return t('impact.temp', { temp: Math.round(h.temp), hour });
  }
}

export function dateOfDay(trip: Trip, dayIndex: number) {
  return addDaysISO(trip.startDate, dayIndex);
}

export function analyzeDay(
  stops: string[],
  weather: DayWeather | undefined,
  dayIndex: number,
  date: string,
  times?: StopTimes,
): StopImpact[] {
  if (!weather) return [];
  return buildSchedule(stops, times).flatMap((stop) => {
    if (!isOutdoor(stop.place)) return [];
    const fromHour = Math.floor(stop.start / 60);
    const toHour = Math.min(23, Math.floor((stop.end - 1) / 60));
    const hours = weather.hours.filter((h) => h.hour >= fromHour && h.hour <= toHour);
    const worst = worstCondition(hours);
    if (!worst) return [];
    return [
      {
        dayIndex,
        date,
        placeId: stop.place.id,
        placeName: stop.place.name,
        reason: worst.reason,
        severity: worst.reason === 'storm' || worst.reason === 'snow' || worst.reason === 'heat' ? 'alerta' : 'atencao',
        hour: worst.hour.hour,
        detail: describe(worst.reason, worst.hour),
      } satisfies StopImpact,
    ];
  });
}

export function analyzeTrip(trip: Trip, forecast: Forecast | null): StopImpact[] {
  if (!forecast) return [];
  return trip.itinerary.flatMap((stops, i) => {
    const date = dateOfDay(trip, i);
    return analyzeDay(stops, forecast.days[date], i, date, trip.times);
  });
}

// Alternativa coberta mais próxima, ainda fora do roteiro, para trocar a atividade afetada.
// De dia, prioriza cultura/gastronomia e não sugere vida noturna.
export function indoorAlternative(trip: Trip, placeId: string, startMinutes = 12 * 60): Place | undefined {
  const place = getPlace(placeId);
  if (!place) return undefined;
  const used = new Set(trip.itinerary.flat());
  const night = startMinutes >= 19 * 60;
  const rank = (pl: Place) => (pl.category === 'Cultura' ? 0 : pl.category === 'Gastronomia' ? 1 : 2);
  return getPlacesByCity(trip.cityId)
    .filter((pl) => !used.has(pl.id) && !isOutdoor(pl) && (night || pl.category !== 'Vida Noturna'))
    .sort((a, b) => rank(a) - rank(b) || distanceKm(place, a) - distanceKm(place, b))[0];
}
