import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getDestination, getPlacesByCity, Place, registerPlaces } from '../data/catalog';
import { t, tn } from '../i18n';
import { addDaysISO, formatDateRange, formatShortDate, todayISO } from '../utils/dates';
import { planItinerary, StopTimes } from '../utils/route';
import { useAuth } from './AuthContext';

export type Trip = {
  id: string;
  cityId: string;
  title: string;
  startDate: string; // ISO yyyy-mm-dd
  itinerary: string[][]; // um array de placeIds por dia
  times?: StopTimes; // horários fixos escolhidos pelo usuário (placeId -> minutos)
  createdAt: number;
};

type TripsContextValue = {
  trips: Trip[];
  likedIds: string[];
  seenIds: string[];
  isReady: boolean;
  getTrip: (id: string) => Trip | undefined;
  createTrip: (cityId: string, days: number, startDate?: string) => Trip;
  setTripDates: (id: string, startDate: string, days: number) => void;
  addCustomPlace: (place: Place) => void;
  updateTrip: (id: string, patch: Partial<Omit<Trip, 'id'>>) => void;
  deleteTrip: (id: string) => void;
  restoreTrip: (trip: Trip, index: number) => void;
  swipe: (destinationId: string, liked: boolean) => void;
  undoSwipe: (destinationId: string) => void;
  unlike: (destinationId: string) => void;
  resetDeck: () => void;
};

// customPlaces: locais sugeridos pela IA que o usuário adicionou a algum roteiro.
type Persisted = { trips: Trip[]; likedIds: string[]; seenIds: string[]; customPlaces: Place[] };

const TripsContext = createContext<TripsContextValue | undefined>(undefined);

const isoDaysFromNow = (days: number) => addDaysISO(todayISO(), days);

// Viagens de exemplo de versões antigas: toda conta começa sem viagens.
const isLegacySeed = (trip: Trip) => trip.id.startsWith('seed-');

export function TripsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = user ? `@rover:trips:${user.id}` : null;
  const [state, setState] = useState<Persisted>({ trips: [], likedIds: [], seenIds: [], customPlaces: [] });
  // Chave já carregada: evita salvar os dados de um usuário na chave de outro durante a troca de conta.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const isReady = storageKey !== null && loadedKey === storageKey;

  useEffect(() => {
    if (!storageKey) return;
    let active = true;
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (!active) return;
      const loaded: Persisted = raw
        ? { customPlaces: [], ...(JSON.parse(raw) as Partial<Persisted>) } as Persisted
        : { trips: [], likedIds: [], seenIds: [], customPlaces: [] };
      loaded.trips = loaded.trips.filter((t) => !isLegacySeed(t));
      registerPlaces(loaded.customPlaces);
      setState(loaded);
      setLoadedKey(storageKey);
    });
    return () => {
      active = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (storageKey && isReady) AsyncStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey, isReady]);

  const getTrip = useCallback((id: string) => state.trips.find((t) => t.id === id), [state.trips]);

  const createTrip = useCallback((cityId: string, days: number, startDate = isoDaysFromNow(14)) => {
    const destination = getDestination(cityId);
    const ids = getPlacesByCity(cityId).map((pl) => pl.id);
    const trip: Trip = {
      id: String(Date.now()),
      cityId,
      title: days === 1 ? t('trip.titleDayTrip', { city: destination?.name ?? '' }) : t('trip.titleDays', { city: destination?.name ?? '', count: days }),
      startDate,
      itinerary: planItinerary(days === 1 ? ids.slice(0, 6) : ids, days),
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, trips: [trip, ...s.trips] }));
    return trip;
  }, []);

  const addCustomPlace = useCallback((place: Place) => {
    registerPlaces([place]);
    setState((s) =>
      s.customPlaces.some((pl) => pl.id === place.id) ? s : { ...s, customPlaces: [...s.customPlaces, place] },
    );
  }, []);

  const updateTrip = useCallback((id: string, patch: Partial<Omit<Trip, 'id'>>) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }, []);

  // Novo intervalo de datas. Dias a mais entram vazios; paradas de dias removidos vão para o último dia mantido.
  const setTripDates = useCallback((id: string, startDate: string, days: number) => {
    setState((s) => ({
      ...s,
      trips: s.trips.map((t) => {
        if (t.id !== id) return t;
        const kept = t.itinerary.slice(0, days);
        while (kept.length < days) kept.push([]);
        const overflow = t.itinerary.slice(days).flat();
        if (overflow.length) kept[days - 1] = [...kept[days - 1], ...overflow.filter((p) => !kept[days - 1].includes(p))];
        return { ...t, startDate, itinerary: kept };
      }),
    }));
  }, []);

  const deleteTrip = useCallback((id: string) => {
    setState((s) => ({ ...s, trips: s.trips.filter((t) => t.id !== id) }));
  }, []);

  // Desfazer exclusão: devolve a viagem na posição original.
  const restoreTrip = useCallback((trip: Trip, index: number) => {
    setState((s) => {
      if (s.trips.some((t) => t.id === trip.id)) return s;
      const trips = [...s.trips];
      trips.splice(Math.min(index, trips.length), 0, trip);
      return { ...s, trips };
    });
  }, []);

  const swipe = useCallback((destinationId: string, liked: boolean) => {
    setState((s) => ({
      ...s,
      seenIds: s.seenIds.includes(destinationId) ? s.seenIds : [...s.seenIds, destinationId],
      likedIds: liked && !s.likedIds.includes(destinationId) ? [destinationId, ...s.likedIds] : s.likedIds,
    }));
  }, []);

  const undoSwipe = useCallback((destinationId: string) => {
    setState((s) => ({
      ...s,
      seenIds: s.seenIds.filter((id) => id !== destinationId),
      likedIds: s.likedIds.filter((id) => id !== destinationId),
    }));
  }, []);

  const unlike = useCallback((destinationId: string) => {
    setState((s) => ({ ...s, likedIds: s.likedIds.filter((id) => id !== destinationId) }));
  }, []);

  const resetDeck = useCallback(() => setState((s) => ({ ...s, seenIds: [] })), []);

  const value = useMemo<TripsContextValue>(
    () => ({
      trips: state.trips,
      likedIds: state.likedIds,
      seenIds: state.seenIds,
      isReady,
      getTrip,
      createTrip,
      setTripDates,
      addCustomPlace,
      updateTrip,
      deleteTrip,
      restoreTrip,
      swipe,
      undoSwipe,
      unlike,
      resetDeck,
    }),
    [state, isReady, getTrip, createTrip, setTripDates, addCustomPlace, updateTrip, deleteTrip, restoreTrip, swipe, undoSwipe, unlike, resetDeck],
  );

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export function useTrips() {
  const context = useContext(TripsContext);
  if (!context) throw new Error('useTrips deve ser usado dentro de TripsProvider');
  return context;
}

// Usuário gratuito pode usar roteiros de 1 dia (Day Trip); vários dias é Premium.
export const isTripLocked = (trip: Trip, isPremium: boolean) => !isPremium && trip.itinerary.length > 1;

// Plano gratuito: apenas 1 viagem (Day Trip) por vez. Viagens bloqueadas (vários dias) não contam,
// pois não podem ser usadas sem o Premium.
export const FREE_TRIP_LIMIT = 1;
export const canCreateTrip = (trips: Trip[], isPremium: boolean) =>
  isPremium || trips.filter((t) => !isTripLocked(t, isPremium)).length < FREE_TRIP_LIMIT;

// Próxima viagem: a que acontece primeiro entre as que ainda não terminaram e que o plano libera.
// Se todas já passaram, mostra a mais recente.
export function nextUpcomingTrip(trips: Trip[], isPremium: boolean): Trip | undefined {
  const today = todayISO();
  const available = trips.filter((t) => !isTripLocked(t, isPremium));
  const upcoming = available
    .filter((t) => addDaysISO(t.startDate, t.itinerary.length - 1) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || b.createdAt - a.createdAt);
  return upcoming[0] ?? [...available].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
}

export const formatTripDate = formatShortDate;

export function tripMeta(trip: Trip) {
  const days = trip.itinerary.length;
  const stops = trip.itinerary.reduce((acc, day) => acc + day.length, 0);
  return `${formatDateRange(trip.startDate, days)} • ${tn('unit.day', days)} • ${tn('unit.stop', stops)}`;
}
