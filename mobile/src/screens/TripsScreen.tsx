import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  BottomSheet,
  Button,
  DateRange,
  DateRangePicker,
  DestinationSuggestions,
  Dialog,
  EmptyState,
  Icon,
  IconButton,
  Screen,
  TripCard,
} from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { canCreateTrip, isTripLocked, Trip, tripMeta, useTrips } from '../contexts/TripsContext';
import { destinations } from '../data/catalog';
import { AppTabScreenProps } from '../navigation/types';
import { radii, spacing } from '../tokens';
import { diffDays } from '../utils/dates';
import { tap } from '../utils/haptics';

const MAX_DAYS = 7;

export function TripsScreen({ navigation, route }: AppTabScreenProps<'Trips'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const { trips, likedIds, createTrip, deleteTrip, restoreTrip } = useTrips();
  const isPremium = Boolean(user?.isPremium);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [cityId, setCityId] = useState<string | null>(null);
  const [step, setStep] = useState<'destination' | 'dates'>('destination');
  const [range, setRange] = useState<DateRange | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [menuTrip, setMenuTrip] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);

  // Destinos curtidos aparecem primeiro na lista de criação.
  const ordered = [...destinations].sort((a, b) => Number(likedIds.includes(b.id)) - Number(likedIds.includes(a.id)));

  // Com destino já escolhido (ex.: sugestão da Home), a criação começa direto no calendário.
  const openSheet = (presetCityId?: string) => {
    if (!canCreateTrip(trips, isPremium)) {
      tap();
      setLimitOpen(true);
      return;
    }
    setCityId(presetCityId ?? null);
    setRange(null);
    setStep(presetCityId ? 'dates' : 'destination');
    setLimitHit(false);
    setSheetOpen(true);
  };

  const presetCityId = route.params?.cityId;
  useEffect(() => {
    if (!presetCityId) return;
    navigation.setParams({ cityId: undefined });
    openSheet(presetCityId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetCityId]);

  const handleCreate = () => {
    if (!cityId || !range || !canCreateTrip(trips, isPremium)) return;
    const trip = createTrip(cityId, diffDays(range.start, range.end) + 1, range.start);
    setSheetOpen(false);
    toast({ message: t('trips.created'), icon: 'map-marker-path', tone: 'success' });
    navigation.navigate('TripDetail', { tripId: trip.id });
  };

  const openTrip = (trip: Trip) =>
    isTripLocked(trip, isPremium) ? navigation.navigate('Premium') : navigation.navigate('TripDetail', { tripId: trip.id });

  const openMenu = (trip: Trip) => {
    tap();
    setMenuTrip(trip);
  };

  const confirmDelete = () => {
    const trip = tripToDelete;
    if (!trip) return;
    const index = trips.findIndex((t) => t.id === trip.id);
    setTripToDelete(null);
    deleteTrip(trip.id);
    tap('medium');
    toast({
      message: t('trips.deleted'),
      icon: 'delete-outline',
      action: { label: t('common.undo'), onPress: () => restoreTrip(trip, index) },
    });
  };


  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="h1">{t('trips.title')}</AppText>
          <AppText variant="body" tone="secondary">
            {isPremium ? t('trips.subtitle') : t('trips.subtitleFree')}
          </AppText>
        </View>
        <IconButton icon="plus" variant="primary" size={48} onPress={() => openSheet()} accessibilityLabel={t('trips.new')} />
      </View>

      {trips.length ? (
        <>
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              locked={isTripLocked(trip, isPremium)}
              onPress={() => openTrip(trip)}
              onMenu={() => openMenu(trip)}
            />
          ))}
          <AppText variant="caption" tone="tertiary" align="center" style={styles.tip}>
            {t('trips.tip')}
          </AppText>
        </>
      ) : (
        <View style={styles.empty}>
          <EmptyState
            icon="bag-suitcase-outline"
            title={t('trips.emptyTitle')}
            description={t('trips.emptyText')}
          >
            <Button title={t('trips.new')} icon="plus" onPress={() => openSheet()} />
          </EmptyState>
          <AppText variant="h3" style={styles.suggestionsTitle}>
            {t('trips.suggestions')}
          </AppText>
          <DestinationSuggestions likedIds={likedIds} onSelect={(d) => openSheet(d.id)} />
        </View>
      )}

      <BottomSheet
        visible={sheetOpen}
        title={step === 'destination' ? t('trips.sheetDestination') : t('trips.sheetDates')}
        subtitle={
          step === 'destination'
            ? t('trips.sheetDestinationText')
            : isPremium
              ? t('trips.sheetDatesText')
              : t('trips.sheetDatesTextFree')
        }
        onClose={() => setSheetOpen(false)}
        footer={
          step === 'destination' ? (
            <Button title={t('common.continue')} icon="arrow-right" iconPosition="right" disabled={!cityId} onPress={() => setStep('dates')} />
          ) : (
            <View style={styles.footerRow}>
              <Button title={t('common.back')} variant="secondary" onPress={() => setStep('destination')} style={styles.flex} />
              <Button title={t('trips.generate')} icon="creation-outline" disabled={!range} onPress={handleCreate} style={styles.generate} />
            </View>
          )
        }
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {step === 'destination' ? (
            <View style={styles.grid}>
              {ordered.map((d) => {
                const selected = d.id === cityId;
                return (
                  <Pressable
                    key={d.id}
                    onPress={() => setCityId(d.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.option, { borderColor: selected ? colors.primary : 'transparent' }]}
                  >
                    <Image source={d.image} style={styles.optionImage} />
                    <View style={styles.optionShade} />
                    <View style={styles.optionText}>
                      <AppText variant="label" tone="inverse" numberOfLines={1}>
                        {d.name}
                      </AppText>
                      {likedIds.includes(d.id) ? <Icon name="heart" size={14} color={colors.accent} /> : null}
                    </View>
                    {selected ? (
                      <View style={[styles.check, { backgroundColor: colors.primary }]}>
                        <Icon name="check" size={14} color={colors.onPrimary} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            ) : (
            <>
              <DateRangePicker
                value={range}
                onChange={(r) => {
                  setRange(r);
                  if (r.start === r.end) setLimitHit(false);
                }}
                maxDays={isPremium ? MAX_DAYS : 1}
                onExceedMax={() => setLimitHit(true)}
              />
              {limitHit || !isPremium ? (
                <View style={[styles.limit, { backgroundColor: isPremium ? colors.surfaceAlt : colors.accentSoft }]}>
                  <Icon name={isPremium ? 'information-outline' : 'crown-outline'} size={18} color={isPremium ? colors.textSecondary : colors.accentText} />
                  <AppText variant="bodySm" tone={isPremium ? 'secondary' : 'accent'} style={styles.flex}>
                    {isPremium
                      ? t('trips.maxDays', { count: MAX_DAYS })
                      : t('trips.freeOneDay')}
                  </AppText>
                  {!isPremium ? (
                    <Button
                      title={t('common.see')}
                      size="sm"
                      variant="accent"
                      onPress={() => {
                        setSheetOpen(false);
                        navigation.navigate('Premium');
                      }}
                    />
                  ) : null}
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={Boolean(menuTrip)}
        title={menuTrip?.title ?? ''}
        subtitle={menuTrip ? tripMeta(menuTrip) : undefined}
        onClose={() => setMenuTrip(null)}
      >
        <MenuItem
          icon={menuTrip && isTripLocked(menuTrip, isPremium) ? 'crown-outline' : 'map-marker-path'}
          label={menuTrip && isTripLocked(menuTrip, isPremium) ? t('trips.unlock') : t('trips.openEdit')}
          onPress={() => {
            const trip = menuTrip;
            setMenuTrip(null);
            if (trip) openTrip(trip);
          }}
        />
        <MenuItem
          icon="delete-outline"
          label={t('trips.delete')}
          danger
          onPress={() => {
            setTripToDelete(menuTrip);
            setMenuTrip(null);
          }}
        />
      </BottomSheet>

      <Dialog
        visible={Boolean(tripToDelete)}
        tone="danger"
        icon="delete-outline"
        title={t('trips.deleteTitle')}
        message={tripToDelete ? t('trips.deleteMessage', { title: tripToDelete.title }) : undefined}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
        onCancel={() => setTripToDelete(null)}
      />

      <Dialog
        visible={limitOpen}
        icon="crown-outline"
        title={t('limit.title')}
        message={t('limit.message')}
        confirmLabel={t('common.seePremium')}
        cancelLabel={t('common.notNow')}
        onConfirm={() => {
          setLimitOpen(false);
          navigation.navigate('Premium');
        }}
        onCancel={() => setLimitOpen(false)}
      />
    </Screen>
  );
}

function MenuItem({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: 'map-marker-path' | 'crown-outline' | 'delete-outline';
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg, marginBottom: spacing.xxl },
  empty: { paddingTop: spacing.xxxl },
  suggestionsTitle: { marginTop: spacing.xxxl, marginBottom: spacing.md },
  tip: { marginTop: spacing.xs },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  menuIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  footerRow: { flexDirection: 'row', gap: spacing.md },
  generate: { flex: 1.6 },
  limit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: { width: '48.5%', height: 92, borderRadius: radii.md, overflow: 'hidden', borderWidth: 3 },
  optionImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  optionShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,18,30,0.35)' },
  optionText: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
