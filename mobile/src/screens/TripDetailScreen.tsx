import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AiSuggestions,
  AppText,
  Badge,
  BottomSheet,
  Button,
  Chip,
  CoverImage,
  DateRange,
  DateRangePicker,
  Dialog,
  EmptyState,
  Icon,
  IconButton,
  SegmentedControl,
  Stat,
  StopItem,
  TextField,
  TimePicker,
  WeatherCard,
} from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { formatTripDate, tripMeta, useTrips } from '../contexts/TripsContext';
import { categoryIcons, categoryLabel, getDestination, getPlacesByCity } from '../data/catalog';
import { AppStackScreenProps } from '../navigation/types';
import { AiSuggestion } from '../services/ai';
import { radii, shadows, spacing } from '../tokens';
import { useTripWeather } from '../hooks/useTripWeather';
import { weatherInfo } from '../services/weather';
import { addDaysISO, diffDays, todayISO } from '../utils/dates';
import { indoorAlternative } from '../utils/weatherImpact';
import { success, tap } from '../utils/haptics';
import { buildSchedule, formatClock, formatDuration, formatKm, optimizeRoute, routeDistance, StopTimes } from '../utils/route';

const addDays = addDaysISO;

export function TripDetailScreen({ navigation, route }: AppStackScreenProps<'TripDetail'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { t, tn } = useI18n();
  const { user } = useAuth();
  const { trips, getTrip, updateTrip, setTripDates, deleteTrip, restoreTrip, addCustomPlace } = useTrips();
  const trip = getTrip(route.params.tripId);
  const weather = useTripWeather(trip);

  const [day, setDay] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[][]>(trip?.itinerary ?? []);
  const [draftTimes, setDraftTimes] = useState<StopTimes>(trip?.times ?? {});
  // Parada com o seletor de horário aberto
  const [timeStop, setTimeStop] = useState<{ placeId: string; name: string; value: number } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addTab, setAddTab] = useState<'catalog' | 'ai'>('catalog');
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(trip?.title ?? '');
  const [datesOpen, setDatesOpen] = useState(false);
  const [newRange, setNewRange] = useState<DateRange | null>(null);

  useEffect(() => {
    if (!editing && trip) {
      setDraft(trip.itinerary);
      setDraftTimes(trip.times ?? {});
    }
  }, [trip, editing]);

  const itinerary = editing ? draft : (trip?.itinerary ?? []);
  const times = useMemo(() => (editing ? draftTimes : (trip?.times ?? {})), [editing, draftTimes, trip?.times]);
  const dayStops = itinerary[day] ?? [];
  const schedule = useMemo(() => buildSchedule(dayStops, times), [dayStops, times]);
  const dayKm = routeDistance(dayStops);
  const optimized = useMemo(() => optimizeRoute(dayStops), [dayStops]);
  const savingKm = dayKm - routeDistance(optimized);
  const dayMinutes = schedule.length ? schedule[schedule.length - 1].end - schedule[0].start : 0;

  if (!trip) return null;

  const destination = getDestination(trip.cityId);
  const usedIds = new Set(itinerary.flat());
  const available = getPlacesByCity(trip.cityId).filter((pl) => !usedIds.has(pl.id));
  const hasChanges =
    JSON.stringify(draft) !== JSON.stringify(trip.itinerary) || JSON.stringify(draftTimes) !== JSON.stringify(trip.times ?? {});

  const setDayStops = (stops: string[]) => {
    setDraft((prev) => prev.map((d, i) => (i === day ? stops : d)));
  };

  const move = (from: number, to: number) => {
    const next = [...dayStops];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setDayStops(next);
    tap();
  };

  const remove = (index: number) => {
    const { [dayStops[index]]: _removed, ...rest } = draftTimes;
    setDraftTimes(rest);
    setDayStops(dayStops.filter((_, i) => i !== index));
    tap('medium');
  };

  const addPlace = (placeId: string) => {
    setDayStops([...dayStops, placeId]);
    setAddOpen(false);
    tap();
  };

  // Lugar sugerido pelo Llama: vira um Place registrado e entra no fim do dia.
  const addAiPlace = (suggestion: AiSuggestion) => {
    const slug = suggestion.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-');
    const id = `${trip.cityId}-ai-${slug}`;
    addCustomPlace({
      id,
      cityId: trip.cityId,
      name: suggestion.name,
      category: suggestion.category,
      lat: suggestion.lat,
      lng: suggestion.lng,
      durationMin: suggestion.durationMin,
      reason: suggestion.reason,
      outdoor: suggestion.outdoor,
      source: 'ai',
    });
    if (!dayStops.includes(id)) setDayStops([...dayStops, id]);
    tap();
    toast({ message: t('detail.aiAdded', { name: suggestion.name, n: day + 1 }), icon: 'creation-outline', tone: 'success' });
  };

  const dayDate = addDays(trip.startDate, day);
  const dayWeather = weather.forecast?.days[dayDate];
  const dayImpacts = weather.impacts.filter((imp) => imp.dayIndex === day);

  // Troca uma atividade ao ar livre afetada pelo clima por uma alternativa coberta próxima.
  const swapForIndoor = (placeId: string, altId: string, altName: string) => {
    const replace = (stops: string[]) => stops.map((id) => (id === placeId ? altId : id));
    // a alternativa herda o horário fixo da atividade trocada
    const moveTime = (t: StopTimes) => {
      if (t[placeId] === undefined) return t;
      const { [placeId]: start, ...rest } = t;
      return { ...rest, [altId]: start };
    };
    if (editing) {
      setDayStops(replace(dayStops));
      setDraftTimes(moveTime(draftTimes));
      return;
    }
    const previous = trip.itinerary;
    const previousTimes = trip.times;
    updateTrip(trip.id, { itinerary: trip.itinerary.map((d, i) => (i === day ? replace(d) : d)), times: moveTime(trip.times ?? {}) });
    success();
    toast({
      message: t('detail.swapped', { name: altName }),
      icon: 'swap-horizontal',
      tone: 'success',
      action: { label: t('common.undo'), onPress: () => updateTrip(trip.id, { itinerary: previous, times: previousTimes }) },
    });
  };

  // Fixa (ou volta para automático, com minutes = null) o horário de início de uma parada.
  const setStopTime = (placeId: string, minutes: number | null) => {
    const apply = (t: StopTimes) => {
      const { [placeId]: _old, ...rest } = t;
      return minutes === null ? rest : { ...rest, [placeId]: minutes };
    };
    setTimeStop(null);
    tap();
    if (editing) {
      setDraftTimes(apply(draftTimes));
      return;
    }
    const previousTimes = trip.times;
    updateTrip(trip.id, { times: apply(trip.times ?? {}) });
    toast({
      message: minutes === null ? t('detail.timeAuto') : t('detail.timeChanged', { time: formatClock(minutes) }),
      icon: 'clock-check-outline',
      tone: 'success',
      action: { label: t('common.undo'), onPress: () => updateTrip(trip.id, { times: previousTimes }) },
    });
  };

  const openDates = () => {
    setNewRange({ start: trip.startDate, end: addDays(trip.startDate, trip.itinerary.length - 1) });
    setDatesOpen(true);
  };

  const newDays = newRange ? diffDays(newRange.start, newRange.end) + 1 : trip.itinerary.length;
  const movedStops = newDays < trip.itinerary.length ? trip.itinerary.slice(newDays).flat().length : 0;

  const saveDates = () => {
    if (!newRange) return;
    setTripDates(trip.id, newRange.start, newDays);
    if (day >= newDays) setDay(newDays - 1);
    setDatesOpen(false);
    toast({ message: t('detail.datesUpdated'), icon: 'calendar-check', tone: 'success' });
  };

  const applyOptimization = () => {
    const saved = formatKm(savingKm);
    if (editing) {
      setDayStops(optimized);
    } else {
      updateTrip(trip.id, { itinerary: trip.itinerary.map((d, i) => (i === day ? optimized : d)) });
    }
    success();
    toast({ message: t('detail.optimized', { km: saved }), icon: 'vector-polyline', tone: 'success' });
  };

  const startEditing = () => {
    setDraft(trip.itinerary);
    setDraftTimes(trip.times ?? {});
    setEditing(true);
    tap();
  };

  const save = () => {
    updateTrip(trip.id, { itinerary: draft, times: draftTimes });
    setEditing(false);
    success();
    toast({ message: t('detail.updated'), icon: 'check-circle', tone: 'success' });
  };

  const cancelEditing = () => {
    if (hasChanges) setDiscardOpen(true);
    else setEditing(false);
  };

  const confirmRename = () => {
    if (newTitle.trim()) updateTrip(trip.id, { title: newTitle.trim() });
    setRenameOpen(false);
  };

  const confirmDelete = () => {
    setDeleteOpen(false);
    const deleted = trip;
    const index = trips.findIndex((t) => t.id === deleted.id);
    deleteTrip(deleted.id);
    toast({
      message: t('trips.deleted'),
      icon: 'delete-outline',
      action: { label: t('common.undo'), onPress: () => restoreTrip(deleted, index) },
    });
    navigation.goBack();
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: editing ? 140 : spacing.xxxl + insets.bottom }}
      >
        <View style={styles.hero}>
          <CoverImage source={destination?.image} />
          <LinearGradient
            colors={['rgba(8,18,30,0.55)', 'rgba(8,18,30,0)', 'rgba(8,18,30,0.85)']}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']} style={styles.heroBar}>
            <IconButton icon="arrow-left" variant="glass" onPress={navigation.goBack} accessibilityLabel={t('common.back')} />
            <IconButton icon="dots-horizontal" variant="glass" onPress={() => setMenuOpen(true)} accessibilityLabel={t('detail.moreOptions')} />
          </SafeAreaView>
          <View style={styles.heroText}>
            <Badge label={`${destination?.name}, ${destination?.country}`} icon="map-marker-outline" tone="glass" />
            <AppText variant="h1" tone="inverse" style={styles.title}>
              {trip.title}
            </AppText>
            <AppText variant="bodySm" color="rgba(255,255,255,0.85)">
              {tripMeta(trip)}
            </AppText>
          </View>
        </View>

        <View style={[styles.body, { backgroundColor: colors.background }]}>
          <View style={styles.stats}>
            <Stat icon="map-marker-outline" value={String(dayStops.length)} label={t('detail.stops')} />
            <Stat icon="map-marker-path" value={formatKm(dayKm)} label={t('detail.distance')} />
            <Stat icon="clock-outline" value={formatDuration(dayMinutes)} label={t('detail.duration')} />
          </View>

          {itinerary.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll} contentContainerStyle={styles.days}>
              {itinerary.map((_, i) => (
                <Chip
                  key={i}
                  icon={(() => {
                    const w = weather.forecast?.days[addDays(trip.startDate, i)];
                    return w ? weatherInfo(w.code).icon : undefined;
                  })()}
                  label={t('detail.dayChip', { n: i + 1, date: formatTripDate(addDays(trip.startDate, i)) })}
                  selected={i === day}
                  onPress={() => setDay(i)}
                />
              ))}
            </ScrollView>
          ) : null}

          <WeatherCard
            status={weather.status === 'ready' && !dayWeather ? 'unavailable' : weather.status}
            day={dayWeather}
            current={dayDate === todayISO() ? weather.forecast?.current : undefined}
            cityName={destination?.name ?? ''}
            impactedCount={dayImpacts.length}
            availableFrom={addDays(weather.availableFrom, day)}
          />

          <View style={styles.sectionRow}>
            <View style={styles.flex}>
              <AppText variant="h3">{editing ? t('detail.editingTitle') : t('detail.dayTitle')}</AppText>
              <AppText variant="caption" tone="tertiary">
                {editing
                  ? t('detail.editingHint')
                  : `${schedule.length ? `${t('detail.startsAt', { time: formatClock(schedule[0].start) })} · ` : ''}${formatTripDate(addDays(trip.startDate, day))}`}
              </AppText>
            </View>
            {!editing ? <Button title={t('detail.edit')} icon="pencil-outline" size="sm" variant="secondary" onPress={startEditing} /> : null}
          </View>

          {savingKm > 0.05 ? (
            <View style={[styles.optimize, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
              <Icon name="vector-polyline" size={22} color={colors.success} />
              <View style={styles.flex}>
                <AppText variant="label">{t('detail.optimizeTitle', { km: formatKm(savingKm) })}</AppText>
                <AppText variant="caption" tone="secondary">
                  {t('detail.optimizeText')}
                </AppText>
              </View>
              <Button title={t('detail.optimize')} size="sm" onPress={applyOptimization} />
            </View>
          ) : dayStops.length > 2 ? (
            <View style={[styles.optimized, { backgroundColor: colors.primarySoft }]}>
              <Icon name="check-circle" size={18} color={colors.primaryText} />
              <AppText variant="caption" tone="primary">
                {t('detail.optimal')}
              </AppText>
            </View>
          ) : null}

          {schedule.length ? (
            schedule.map((stop, i) => {
              const impact = dayImpacts.find((imp) => imp.placeId === stop.place.id);
              const alternative = impact ? indoorAlternative({ ...trip, itinerary }, stop.place.id, stop.start) : undefined;
              return (
                <StopItem
                  key={stop.place.id}
                  stop={stop}
                  index={i}
                  isLast={i === schedule.length - 1}
                  editing={editing}
                  onMoveUp={i > 0 ? () => move(i, i - 1) : undefined}
                  onMoveDown={i < schedule.length - 1 ? () => move(i, i + 1) : undefined}
                  onRemove={() => remove(i)}
                  weather={dayWeather?.hours.find((h) => h.hour === Math.floor(stop.start / 60))}
                  impact={impact}
                  swapLabel={alternative?.name}
                  onSwap={alternative ? () => swapForIndoor(stop.place.id, alternative.id, alternative.name) : undefined}
                  onEditTime={() => setTimeStop({ placeId: stop.place.id, name: stop.place.name, value: stop.start })}
                />
              );
            })
          ) : (
            <View style={styles.emptyDay}>
              <EmptyState icon="map-marker-plus-outline" title={t('detail.freeDayTitle')} description={t('detail.freeDayText')}>
                {!editing ? <Button title={t('detail.addStops')} icon="plus" onPress={startEditing} /> : null}
              </EmptyState>
            </View>
          )}

          {editing ? (
            <Pressable
              onPress={() => setAddOpen(true)}
              style={({ pressed }) => [
                styles.addStop,
                { borderColor: colors.primary, backgroundColor: pressed ? colors.primarySoft : 'transparent' },
              ]}
            >
              <Icon name="plus-circle-outline" size={20} color={colors.primaryText} />
              <AppText variant="label" tone="primary">
                {t('detail.addStop')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {editing ? (
        <View
          style={[
            styles.editBar,
            shadows.lg,
            { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow, paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <Button title={t('common.cancel')} variant="secondary" onPress={cancelEditing} style={styles.flex} />
          <Button title={t('detail.save')} icon="check" disabled={!hasChanges} onPress={save} style={styles.saveButton} />
        </View>
      ) : null}

      <BottomSheet
        visible={addOpen}
        title={t('detail.addStop')}
        subtitle={t('detail.addStopSubtitle', { city: destination?.name ?? '', n: day + 1 })}
        onClose={() => setAddOpen(false)}
      >
        <View style={styles.addTabs}>
          <SegmentedControl
            value={addTab}
            onChange={setAddTab}
            options={[
              { value: 'catalog', label: t('detail.tabCatalog'), icon: 'map-marker-outline' },
              { value: 'ai', label: t('detail.tabAi'), icon: 'creation-outline' },
            ]}
          />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {addTab === 'ai' ? (
            <AiSuggestions
              cityId={trip.cityId}
              existingNames={getPlacesByCity(trip.cityId).map((pl) => pl.name)}
              interests={[...new Set(schedule.map((s) => s.place.category))]}
              isPremium={Boolean(user?.isPremium)}
              onAdd={addAiPlace}
              onUpgrade={() => {
                setAddOpen(false);
                navigation.navigate('Premium');
              }}
            />
          ) : available.length ? (
            available.map((place) => (
              <Pressable
                key={place.id}
                onPress={() => addPlace(place.id)}
                style={({ pressed }) => [
                  styles.placeRow,
                  { borderColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : colors.surface },
                ]}
              >
                <View style={[styles.placeIcon, { backgroundColor: place.source === 'ai' ? colors.accentSoft : colors.primarySoft }]}>
                  <Icon
                    name={categoryIcons[place.category]}
                    size={20}
                    color={place.source === 'ai' ? colors.accentText : colors.primary}
                  />
                </View>
                <View style={styles.flex}>
                  <AppText variant="title">{place.name}</AppText>
                  <AppText variant="caption" tone="tertiary">
                    {categoryLabel(place.category)} · {formatDuration(place.durationMin)}
                    {place.source === 'ai' ? ` · ${t('stop.ai')}` : ''}
                  </AppText>
                </View>
                <Icon name="plus" size={22} color={colors.primaryText} />
              </Pressable>
            ))
          ) : (
            <View style={styles.sheetEmpty}>
              <EmptyState
                icon="check-all"
                title={t('detail.allInTitle')}
                description={t('detail.allInText')}
              />
            </View>
          )}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={Boolean(timeStop)}
        title={t('detail.timeTitle')}
        subtitle={timeStop ? t('detail.timeSubtitle', { name: timeStop.name, n: day + 1 }) : undefined}
        onClose={() => setTimeStop(null)}
        footer={
          timeStop ? (
            <View style={styles.footerRow}>
              {times[timeStop.placeId] !== undefined ? (
                <Button title={t('detail.timeAutoButton')} variant="secondary" onPress={() => setStopTime(timeStop.placeId, null)} style={styles.flex} />
              ) : null}
              <Button
                title={t('detail.timeSave')}
                icon="clock-check-outline"
                onPress={() => setStopTime(timeStop.placeId, timeStop.value)}
                style={styles.saveButton}
              />
            </View>
          ) : undefined
        }
      >
        {timeStop ? <TimePicker value={timeStop.value} onChange={(value) => setTimeStop({ ...timeStop, value })} /> : null}
      </BottomSheet>

      <BottomSheet visible={menuOpen} title={t('detail.optionsTitle')} onClose={() => setMenuOpen(false)}>
        <MenuItem
          icon="pencil-outline"
          label={t('detail.rename')}
          onPress={() => {
            setMenuOpen(false);
            setNewTitle(trip.title);
            setRenameOpen(true);
          }}
        />
        <MenuItem
          icon="calendar-range"
          label={t('detail.changeDates')}
          onPress={() => {
            setMenuOpen(false);
            openDates();
          }}
        />
        <MenuItem
          icon="playlist-edit"
          label={t('detail.editItinerary')}
          onPress={() => {
            setMenuOpen(false);
            startEditing();
          }}
        />
        <MenuItem
          icon="delete-outline"
          label={t('trips.delete')}
          danger
          onPress={() => {
            setMenuOpen(false);
            setDeleteOpen(true);
          }}
        />
      </BottomSheet>

      <Dialog
        visible={renameOpen}
        icon="pencil-outline"
        title={t('detail.rename')}
        confirmLabel={t('detail.save')}
        onConfirm={confirmRename}
        onCancel={() => setRenameOpen(false)}
      >
        <View style={styles.renameField}>
          <TextField value={newTitle} onChangeText={setNewTitle} placeholder={t('detail.namePlaceholder')} autoFocus onSubmitEditing={confirmRename} />
        </View>
      </Dialog>

      <Dialog
        visible={deleteOpen}
        tone="danger"
        icon="delete-outline"
        title={t('trips.deleteTitle')}
        message={t('detail.deleteMessage', { title: trip.title })}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <BottomSheet
        visible={datesOpen}
        title={t('detail.changeDates')}
        subtitle={
          user?.isPremium
            ? t('detail.datesSubtitle')
            : t('detail.datesSubtitleFree')
        }
        onClose={() => setDatesOpen(false)}
        footer={<Button title={t('detail.saveDates')} icon="calendar-check" disabled={!newRange} onPress={saveDates} />}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <DateRangePicker
            value={newRange}
            onChange={setNewRange}
            maxDays={user?.isPremium ? 7 : 1}
            onExceedMax={() =>
              toast({
                message: user?.isPremium ? t('detail.maxDaysToast') : t('detail.multiDayPremium'),
                icon: 'information-outline',
              })
            }
          />
          {!user?.isPremium ? (
            <View style={[styles.datesNote, { backgroundColor: colors.accentSoft }]}>
              <Icon name="crown-outline" size={18} color={colors.accentText} />
              <AppText variant="bodySm" tone="accent" style={styles.flex}>
                {t('trips.freeOneDay')}
              </AppText>
            </View>
          ) : movedStops > 0 ? (
            <View style={[styles.datesNote, { backgroundColor: colors.accentSoft }]}>
              <Icon name="information-outline" size={18} color={colors.accentText} />
              <AppText variant="bodySm" tone="accent" style={styles.flex}>
                {tn('detail.shorter', movedStops)}
              </AppText>
            </View>
          ) : newDays > trip.itinerary.length ? (
            <View style={[styles.datesNote, { backgroundColor: colors.primarySoft }]}>
              <Icon name="information-outline" size={18} color={colors.primaryText} />
              <AppText variant="bodySm" tone="primary" style={styles.flex}>
                {tn('detail.newDays', newDays - trip.itinerary.length)}
              </AppText>
            </View>
          ) : null}
        </ScrollView>
      </BottomSheet>

      <Dialog
        visible={discardOpen}
        tone="danger"
        icon="alert-outline"
        title={t('detail.discardTitle')}
        message={t('detail.discardMessage')}
        confirmLabel={t('detail.discard')}
        cancelLabel={t('detail.keepEditing')}
        onConfirm={() => {
          setDiscardOpen(false);
          setEditing(false);
        }}
        onCancel={() => setDiscardOpen(false)}
      />
    </View>
  );
}

function MenuItem({ icon, label, danger, onPress }: { icon: 'pencil-outline' | 'playlist-edit' | 'delete-outline' | 'calendar-range'; label: string; danger?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? colors.dangerSoft : colors.surfaceAlt }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <AppText variant="title" color={color}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { height: 320, justifyContent: 'space-between' },
  heroBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  heroText: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl + spacing.md },
  title: { marginTop: spacing.sm },
  body: {
    marginTop: -spacing.xxl,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xxl,
  },
  stats: { flexDirection: 'row', gap: spacing.sm },
  daysScroll: { marginHorizontal: -spacing.screen, marginTop: spacing.xl, flexGrow: 0 },
  days: { gap: spacing.sm, paddingHorizontal: spacing.screen },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xxl, marginBottom: spacing.lg },
  optimize: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  optimized: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyDay: { paddingVertical: spacing.xxl },
  addStop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    height: 54,
    marginTop: spacing.lg,
  },
  editBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
  },
  saveButton: { flex: 1.6 },
  footerRow: { flexDirection: 'row', gap: spacing.md },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  placeIcon: { width: 42, height: 42, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  sheetEmpty: { paddingVertical: spacing.xxl },
  addTabs: { marginBottom: spacing.lg },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  menuIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  datesNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radii.sm, padding: spacing.md, marginTop: spacing.md },
  renameField: { marginTop: spacing.lg, marginBottom: -spacing.lg },
});
