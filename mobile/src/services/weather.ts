import { IconName } from '../components/Icon';
import { t } from '../i18n';
import { addDaysISO, todayISO } from '../utils/dates';

// Previsão do tempo via Open-Meteo (https://open-meteo.com): gratuita, sem chave de API,
// previsão por hora de até 16 dias. Horários vêm no fuso da cidade (timezone=auto),
// o mesmo usado nos horários do roteiro.

export const FORECAST_DAYS = 16;
const CACHE_MS = 30 * 60 * 1000;

export type HourWeather = {
  hour: number; // 0–23, horário local da cidade
  temp: number;
  precipProb: number; // %
  precip: number; // mm
  code: number; // código WMO
  wind: number; // km/h
};

export type DayWeather = {
  date: string; // yyyy-mm-dd
  code: number;
  tMax: number;
  tMin: number;
  precipProbMax: number;
  precipSum: number;
  windMax: number;
  hours: HourWeather[];
};

export type CurrentWeather = { temp: number; code: number; wind: number; precip: number; isDay: boolean };

export type Forecast = { timezone: string; current?: CurrentWeather; days: Record<string, DayWeather> };

const cache = new Map<string, { at: number; data: Forecast }>();


// Primeiro dia em que a previsão para `iso` fica disponível.
export const forecastAvailableFrom = (iso: string) => addDaysISO(iso, -(FORECAST_DAYS - 2));

// Recorta o intervalo pedido para a janela que a API cobre (hoje até +15 dias).
function clampRange(start: string, end: string) {
  const min = addDaysISO(todayISO(), -1); // folga para fusos à frente/atrás
  const max = addDaysISO(todayISO(), FORECAST_DAYS - 2);
  const from = start < min ? min : start;
  const to = end > max ? max : end;
  return from <= to ? { from, to } : null;
}

type ApiResponse = {
  timezone: string;
  current?: { temperature_2m: number; weather_code: number; wind_speed_10m: number; precipitation: number; is_day: number };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: (number | null)[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
  };
};

// Retorna null quando as datas estão fora da janela de previsão.
export async function fetchForecast(lat: number, lng: number, startDate: string, endDate: string): Promise<Forecast | null> {
  const range = clampRange(startDate, endDate);
  if (!range) return null;

  const key = `${lat.toFixed(3)},${lng.toFixed(3)},${range.from},${range.to}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,weather_code,precipitation,wind_speed_10m,is_day',
    hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max',
    timezone: 'auto',
    start_date: range.from,
    end_date: range.to,
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo respondeu ${res.status}`);
  const json = (await res.json()) as ApiResponse;

  const days: Record<string, DayWeather> = {};
  json.daily.time.forEach((date, i) => {
    days[date] = {
      date,
      code: json.daily.weather_code[i],
      tMax: json.daily.temperature_2m_max[i],
      tMin: json.daily.temperature_2m_min[i],
      precipProbMax: json.daily.precipitation_probability_max[i] ?? 0,
      precipSum: json.daily.precipitation_sum[i],
      windMax: json.daily.wind_speed_10m_max[i],
      hours: [],
    };
  });
  json.hourly.time.forEach((time, i) => {
    const day = days[time.slice(0, 10)];
    if (!day) return;
    day.hours.push({
      hour: Number(time.slice(11, 13)),
      temp: json.hourly.temperature_2m[i],
      precipProb: json.hourly.precipitation_probability[i] ?? 0,
      precip: json.hourly.precipitation[i],
      code: json.hourly.weather_code[i],
      wind: json.hourly.wind_speed_10m[i],
    });
  });

  const data: Forecast = {
    timezone: json.timezone,
    days,
    current: json.current
      ? {
          temp: json.current.temperature_2m,
          code: json.current.weather_code,
          wind: json.current.wind_speed_10m,
          precip: json.current.precipitation,
          isDay: json.current.is_day === 1,
        }
      : undefined,
  };
  cache.set(key, { at: Date.now(), data });
  return data;
}

// Descrição e ícone para os códigos WMO usados pela Open-Meteo.
export function weatherInfo(code: number, isDay = true): { label: string; icon: IconName } {
  if (code === 0) return { label: t('weather.clear'), icon: isDay ? 'weather-sunny' : 'weather-night' };
  if (code <= 2) return { label: t('weather.partlyCloudy'), icon: isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy' };
  if (code === 3) return { label: t('weather.cloudy'), icon: 'weather-cloudy' };
  if (code === 45 || code === 48) return { label: t('weather.fog'), icon: 'weather-fog' };
  if (code >= 51 && code <= 57) return { label: t('weather.drizzle'), icon: 'weather-partly-rainy' };
  if (code >= 61 && code <= 67) return { label: code >= 65 ? t('weather.heavyRain') : t('weather.rain'), icon: code >= 65 ? 'weather-pouring' : 'weather-rainy' };
  if (code >= 71 && code <= 77) return { label: t('weather.snow'), icon: 'weather-snowy' };
  if (code >= 80 && code <= 82) return { label: t('weather.rainShowers'), icon: 'weather-pouring' };
  if (code === 85 || code === 86) return { label: t('weather.snowShowers'), icon: 'weather-snowy-heavy' };
  if (code >= 95) return { label: t('weather.storm'), icon: 'weather-lightning-rainy' };
  return { label: t('weather.unstable'), icon: 'weather-cloudy' };
}
