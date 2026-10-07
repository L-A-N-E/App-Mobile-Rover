import { useEffect, useMemo, useState } from 'react';

import { useI18n } from '../contexts/LanguageContext';
import { Trip } from '../contexts/TripsContext';
import { getCityCenter } from '../data/catalog';
import { fetchForecast, Forecast, forecastAvailableFrom } from '../services/weather';
import { addDaysISO } from '../utils/dates';
import { analyzeTrip, StopImpact } from '../utils/weatherImpact';

export type TripWeather = {
  status: 'loading' | 'ready' | 'unavailable' | 'error';
  forecast: Forecast | null;
  impacts: StopImpact[];
  availableFrom: string; // data em que a previsão começa a cobrir a viagem
};

// Previsão da cidade da viagem para as datas do roteiro + atividades afetadas.
export function useTripWeather(trip: Trip | undefined): TripWeather {
  const [state, setState] = useState<{ status: TripWeather['status']; forecast: Forecast | null }>({
    status: 'loading',
    forecast: null,
  });

  const cityId = trip?.cityId;
  const start = trip?.startDate;
  const days = trip?.itinerary.length ?? 1;

  useEffect(() => {
    if (!cityId || !start) return;
    let active = true;
    const { lat, lng } = getCityCenter(cityId);
    setState((s) => ({ ...s, status: 'loading' }));
    fetchForecast(lat, lng, start, addDaysISO(start, days - 1))
      .then((forecast) => active && setState({ status: forecast ? 'ready' : 'unavailable', forecast }))
      .catch(() => active && setState({ status: 'error', forecast: null }));
    return () => {
      active = false;
    };
  }, [cityId, start, days]);

  // Reanalisa sem refazer a requisição quando o roteiro muda (ex.: usuário troca uma parada)
  // ou o idioma muda (os textos dos impactos, como "Chuva 80% às 15h", são traduzidos).
  const { language } = useI18n();
  const impacts = useMemo(
    () => (trip ? analyzeTrip(trip, state.forecast) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trip, state.forecast, language],
  );

  return { ...state, impacts, availableFrom: start ? forecastAvailableFrom(start) : '' };
}
