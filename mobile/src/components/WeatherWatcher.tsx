import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/LanguageContext';
import { isTripLocked, useTrips } from '../contexts/TripsContext';
import { getCityCenter, getDestination } from '../data/catalog';
import { notifyWeatherImpacts, WeatherAlertMessage } from '../services/notifications';
import { fetchForecast } from '../services/weather';
import { addDaysISO, todayISO } from '../utils/dates';
import { analyzeTrip } from '../utils/weatherImpact';
import { Dialog } from './Dialog';

const MIN_INTERVAL_MS = 30 * 60 * 1000; // no máximo uma checagem a cada 30 min

type Props = { onOpenTrip: (tripId: string) => void };

// Confere a previsão das próximas viagens ao abrir o app, ao voltar para ele e quando o roteiro muda.
// Se uma atividade ao ar livre for afetada, envia notificação local — ou, onde o sistema não
// permite (Expo Go no Android, web), mostra o alerta dentro do app.
export function WeatherWatcher({ onOpenTrip }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { trips, isReady } = useTrips();
  const [queue, setQueue] = useState<WeatherAlertMessage[]>([]);
  const lastRun = useRef(0);
  const signature = JSON.stringify(trips.map((t) => [t.id, t.startDate, t.itinerary, t.times]));
  const lastSignature = useRef('');

  useEffect(() => {
    if (!isReady || !user) return;

    const check = async (force: boolean) => {
      if (!force && Date.now() - lastRun.current < MIN_INTERVAL_MS) return;
      lastRun.current = Date.now();
      const today = todayISO();
      for (const trip of trips) {
        const end = addDaysISO(trip.startDate, trip.itinerary.length - 1);
        if (end < today || isTripLocked(trip, user.isPremium)) continue;
        const destination = getDestination(trip.cityId);
        try {
          const { lat, lng } = getCityCenter(trip.cityId);
          const forecast = await fetchForecast(lat, lng, trip.startDate, end);
          const inApp = await notifyWeatherImpacts(trip.id, destination?.name ?? '', analyzeTrip(trip, forecast));
          if (inApp.length) setQueue((q) => [...q, ...inApp]);
        } catch {
          // sem internet: tenta de novo na próxima vez
        }
      }
    };

    // roteiro/datas mudaram: checa na hora
    const changed = signature !== lastSignature.current;
    lastSignature.current = signature;
    check(changed);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check(false);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, user?.id, user?.isPremium, signature]);

  const current = queue[0];
  const next = () => setQueue((q) => q.slice(1));

  return (
    <Dialog
      visible={Boolean(current)}
      tone="danger"
      icon="weather-lightning-rainy"
      title={current?.title ?? ''}
      message={current ? t('watcher.message', { body: current.body }) : undefined}
      confirmLabel={t('watcher.view')}
      cancelLabel={t('common.later')}
      onConfirm={() => {
        if (current) onOpenTrip(current.tripId);
        next();
      }}
      onCancel={next}
    />
  );
}
