import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  AttractionCard,
  Avatar,
  Chip,
  DestinationSuggestions,
  Icon,
  IconName,
  PremiumBanner,
  PressableScale,
  Screen,
  SectionHeader,
  TripCard,
} from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { nextUpcomingTrip, useTrips } from '../contexts/TripsContext';
import { categories, categoryIcons, Category, categoryLabel, getDestination, getPlacesByCity } from '../data/catalog';
import { t, tn } from '../i18n';
import { useTripWeather } from '../hooks/useTripWeather';
import { AppTabScreenProps } from '../navigation/types';
import { weatherInfo } from '../services/weather';
import { reasonLabel } from '../utils/weatherImpact';
import { radii, shadows, spacing } from '../tokens';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return t('home.morning');
  if (hour < 18) return t('home.afternoon');
  return t('home.evening');
}

export function HomeScreen({ navigation }: AppTabScreenProps<'Home'>) {
  const { user } = useAuth();
  useI18n(); // re-renderiza a tela ao trocar de idioma
  const { trips, likedIds } = useTrips();
  const [category, setCategory] = useState<Category>('Cultura');
  const isPremium = Boolean(user?.isPremium);

  const nextTrip = nextUpcomingTrip(trips, isPremium);
  const destination = nextTrip ? getDestination(nextTrip.cityId) : undefined;
  const weather = useTripWeather(nextTrip);
  const firstDay = nextTrip ? weather.forecast?.days[nextTrip.startDate] : undefined;
  const heroWeather = firstDay
    ? { icon: weatherInfo(firstDay.code).icon, label: `${Math.round(firstDay.tMax)}° · ${Math.round(firstDay.precipProbMax)}% chuva` }
    : undefined;
  const cityPlaces = useMemo(() => (nextTrip ? getPlacesByCity(nextTrip.cityId) : []), [nextTrip]);
  const filtered = cityPlaces.filter((pl) => pl.category === category);
  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="body" tone="secondary">
            {greeting()},
          </AppText>
          <AppText variant="h1" numberOfLines={1}>
            {firstName}
          </AppText>
        </View>
        <PressableScale onPress={() => navigation.navigate('Profile')} accessibilityLabel={t('home.openProfile')}>
          <Avatar name={user?.name ?? ''} size={48} />
        </PressableScale>
      </View>

      {nextTrip ? (
        <TripCard
          trip={nextTrip}
          variant="hero"
          weather={heroWeather}
          onPress={() => navigation.navigate('TripDetail', { tripId: nextTrip.id })}
        />
      ) : (
        <View>
          <AppText variant="h2">{trips.length ? t('home.noDayTripTitle') : t('home.firstTripTitle')}</AppText>
          <AppText variant="body" tone="secondary" style={styles.suggestionsText}>
            {trips.length ? t('home.noDayTripText') : t('home.firstTripText')}
          </AppText>
          <DestinationSuggestions likedIds={likedIds} onSelect={(d) => navigation.navigate('Trips', { cityId: d.id })} />
        </View>
      )}

      {nextTrip && weather.impacts.length ? (
        <WeatherAlert
          count={weather.impacts.length}
          title={t('home.weatherAffects', { reason: reasonLabel(weather.impacts[0].reason) })}
          detail={weather.impacts
            .slice(0, 2)
            .map((imp) => `${imp.placeName}: ${imp.detail.charAt(0).toLowerCase()}${imp.detail.slice(1)}`)
            .join(' · ')}
          onPress={() => navigation.navigate('TripDetail', { tripId: nextTrip.id })}
        />
      ) : null}

      <View style={styles.quickActions}>
        <QuickAction
          icon="cards-outline"
          label={t('home.quickExplore')}
          caption={t('home.quickExploreCaption')}
          onPress={() => navigation.navigate('Explore')}
        />
        <QuickAction
          icon="map-marker-path"
          label={t('home.quickTrips')}
          caption={tn('unit.trip', trips.length)}
          onPress={() => navigation.navigate('Trips')}
        />
        <QuickAction
          icon="chat-processing-outline"
          label={t('home.quickChat')}
          caption={t('home.quickChatCaption')}
          onPress={() => navigation.navigate('Chat')}
        />
      </View>

      {destination ? (
        <>
          <SectionHeader title={t('home.whatToDo', { city: destination.name })} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chips}
          >
            {categories.map((c) => (
              <Chip key={c} label={categoryLabel(c)} icon={categoryIcons[c]} selected={c === category} onPress={() => setCategory(c)} />
            ))}
          </ScrollView>

          <View style={styles.list}>
            {filtered.length ? (
              filtered.map((place) => (
                <AttractionCard
                  key={place.id}
                  place={place}
                  onPress={() => nextTrip && navigation.navigate('TripDetail', { tripId: nextTrip.id })}
                />
              ))
            ) : (
              <AppText variant="body" tone="tertiary" align="center" style={styles.emptyCategory}>
                {t('home.noCategory')}
              </AppText>
            )}
          </View>
        </>
      ) : null}

      {!isPremium ? (
        <View style={styles.premium}>
          <PremiumBanner
            title={t('home.premiumTitle')}
            description={t('home.premiumText')}
            onPress={() => navigation.navigate('Premium')}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function WeatherAlert({ count, title, detail, onPress }: { count: number; title: string; detail: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.alert, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
    >
      <View style={[styles.alertIcon, { backgroundColor: colors.accent }]}>
        <Icon name="weather-pouring" size={22} color="#FFFFFF" />
      </View>
      <View style={styles.flex}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={2}>
          {detail}
        </AppText>
        <AppText variant="caption" tone="accent" style={styles.alertCta}>
          {tn('home.alertCta', count)} →
        </AppText>
      </View>
    </PressableScale>
  );
}

function QuickAction({ icon, label, caption, onPress }: { icon: IconName; label: string; caption: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      style={[
        styles.quickAction,
        shadows.sm,
        { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: colors.primarySoft }]}>
        <Icon name={icon} size={20} color={colors.primaryText} />
      </View>
      <AppText variant="label" style={styles.quickLabel}>
        {label}
      </AppText>
      <AppText variant="caption" tone="tertiary" numberOfLines={1}>
        {caption}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  alertIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  alertCta: { marginTop: spacing.xs },
  quickActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, marginBottom: spacing.xxxl },
  quickAction: { flex: 1, borderWidth: 1, borderRadius: radii.md, padding: spacing.md },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickLabel: { marginBottom: 2 },
  chipsScroll: { marginHorizontal: -spacing.screen, flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.screen },
  list: { marginTop: spacing.lg },
  emptyCategory: { paddingVertical: spacing.xl },
  premium: { marginTop: spacing.xl },
  suggestionsText: { marginTop: spacing.xs, marginBottom: spacing.lg },
});
