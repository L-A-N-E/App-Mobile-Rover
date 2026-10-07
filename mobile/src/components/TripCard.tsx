import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { Trip, tripMeta } from '../contexts/TripsContext';
import { useTheme } from '../contexts/ThemeContext';
import { getDestination } from '../data/catalog';
import { t } from '../i18n';
import { palette, radii, shadows, spacing } from '../tokens';
import { buildSchedule, formatDuration, formatKm, routeDistance } from '../utils/route';
import { AppText } from './AppText';
import { Badge } from './Chip';
import { CoverImage } from './CoverImage';
import { Icon, IconName } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';

type Props = {
  trip: Trip;
  variant?: 'hero' | 'card';
  locked?: boolean;
  onPress?: () => void;
  onMenu?: () => void; // botão "⋯" e toque longo (variante card)
  weather?: { icon: IconName; label: string }; // previsão do 1º dia (variante hero)
};

function daysUntil(iso: string) {
  const start = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((start.getTime() - today.getTime()) / 86_400_000);
}

function countdownLabel(iso: string) {
  const days = daysUntil(iso);
  if (days < 0) return t('tripCard.done');
  if (days === 0) return t('tripCard.today');
  if (days === 1) return t('tripCard.tomorrow');
  return t('tripCard.inDays', { count: days });
}

// "hero": destaque da Home com texto sobre a foto. "card": item da lista Minhas Viagens.
// A sombra fica num container externo: no iOS, overflow hidden (necessário para arredondar
// a foto) corta a sombra do próprio elemento.
export function TripCard({ trip, variant = 'card', locked, onPress, onMenu, weather }: Props) {
  const { colors } = useTheme();
  const { tn } = useI18n(); // também faz o card re-renderizar ao trocar de idioma
  const destination = getDestination(trip.cityId);
  const totalKm = trip.itinerary.reduce((acc, day) => acc + routeDistance(day), 0);

  if (variant === 'hero') {
    const stops = trip.itinerary.flat().length;
    const firstDay = buildSchedule(trip.itinerary[0] ?? [], trip.times);
    const dayMinutes = firstDay.length ? firstDay[firstDay.length - 1].end - firstDay[0].start : 0;

    return (
      <View style={[styles.heroShadow, shadows.lg, { shadowColor: colors.shadow }]}>
        <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={t('tripCard.open', { title: trip.title })} style={styles.hero}>
          <CoverImage source={destination?.image} />
          <LinearGradient
            colors={['rgba(8,18,30,0.45)', 'rgba(8,18,30,0)', 'rgba(8,18,30,0.55)', 'rgba(8,18,30,0.94)']}
            locations={[0, 0.3, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* padding fica num container interno: no container da foto ele encolhe o width/height 100% da imagem */}
          <View style={styles.heroContent}>
            <View style={styles.heroTop}>
              <Badge label={t('tripCard.next')} icon="airplane" tone="glass" />
              <View style={[styles.countdown, { backgroundColor: colors.accent }]}>
                <Icon name="calendar-clock" size={13} color="#FFFFFF" />
                <AppText variant="caption" color="#FFFFFF">
                  {countdownLabel(trip.startDate)}
                </AppText>
              </View>
            </View>

            <View>
              <AppText variant="caption" color="rgba(255,255,255,0.8)" style={styles.heroPlace}>
                {destination?.name}, {destination?.country}
              </AppText>
              <AppText variant="h1" tone="inverse" numberOfLines={1}>
                {trip.title}
              </AppText>

              <View style={styles.heroFacts}>
                <HeroFact icon="map-marker-outline" label={tn('unit.stop', stops)} />
                <HeroFact icon="map-marker-path" label={formatKm(totalKm)} />
                <HeroFact icon="clock-outline" label={formatDuration(dayMinutes)} />
                {weather ? <HeroFact icon={weather.icon} label={weather.label} /> : null}
              </View>

              <View style={styles.heroCta}>
                <AppText variant="label" color={palette.blue700}>
                  {t('tripCard.viewItinerary')}
                </AppText>
                <Icon name="arrow-right" size={18} color={palette.blue700} />
              </View>
            </View>
          </View>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={[styles.cardShadow, shadows.sm, { shadowColor: colors.shadow }]}>
      <PressableScale
        onPress={onPress}
        onLongPress={onMenu}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel={locked ? t('tripCard.lockedA11y', { title: trip.title }) : t('tripCard.open', { title: trip.title })}
        accessibilityHint={onMenu ? t('tripCard.menuHint') : undefined}
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: locked ? colors.accent : colors.border },
        ]}
      >
        <View style={styles.cardImage}>
          <CoverImage source={destination?.image} />
          <LinearGradient colors={['rgba(8,18,30,0.35)', 'rgba(8,18,30,0)']} locations={[0, 0.5]} style={StyleSheet.absoluteFill} />
          <View style={styles.cardBadges}>
            <Badge label={destination?.country ?? ''} icon="map-marker-outline" tone="glass" />
            {trip.itinerary.length > 1 ? <Badge label="Premium" icon="crown" tone="glass" /> : null}
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.flex}>
            <AppText variant="h3" numberOfLines={1}>
              {trip.title}
            </AppText>
            <AppText variant="bodySm" tone="secondary" style={styles.meta}>
              {tripMeta(trip)}
            </AppText>
          </View>
          <View style={[styles.distance, { backgroundColor: colors.primarySoft }]}>
            <Icon name="map-marker-path" size={14} color={colors.primaryText} />
            <AppText variant="caption" tone="primary">
              {formatKm(totalKm)}
            </AppText>
          </View>
        </View>

        {locked ? (
          <View style={[StyleSheet.absoluteFill, styles.locked, { backgroundColor: colors.overlay }]}>
            <View style={[styles.lockIcon, { backgroundColor: colors.accent }]}>
              <Icon name="lock-outline" size={24} color="#FFFFFF" />
            </View>
            <AppText variant="title" tone="inverse" style={styles.lockedTitle}>
              {t('tripCard.premiumOnly')}
            </AppText>
            <AppText variant="bodySm" color="rgba(255,255,255,0.85)">
              {t('tripCard.multiDay')}
            </AppText>
          </View>
        ) : null}

        {/* fica por cima do bloqueio Premium: a viagem pode ser excluída mesmo bloqueada */}
        {onMenu ? (
          <IconButton
            icon="dots-horizontal"
            variant="glass"
            size={36}
            onPress={onMenu}
            accessibilityLabel={t('tripCard.options', { title: trip.title })}
            style={styles.menu}
          />
        ) : null}
      </PressableScale>
    </View>
  );
}

function HeroFact({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.heroFact}>
      <Icon name={icon} size={14} color="rgba(255,255,255,0.85)" />
      <AppText variant="caption" color="rgba(255,255,255,0.92)">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heroShadow: { borderRadius: radii.xl },
  hero: { height: 270, borderRadius: radii.xl, overflow: 'hidden' },
  heroContent: { flex: 1, justifyContent: 'space-between', padding: spacing.xl },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPlace: { marginBottom: 2 },
  heroFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  heroFact: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
  },
  cardShadow: { borderRadius: radii.xl, marginBottom: spacing.lg },
  card: { borderWidth: 1, borderRadius: radii.xl, overflow: 'hidden' },
  cardImage: { height: 170 },
  cardBadges: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  cardBody: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  meta: { marginTop: 2 },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  locked: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  lockIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  lockedTitle: { marginTop: spacing.xs },
  menu: { position: 'absolute', top: spacing.md, right: spacing.md },
});
