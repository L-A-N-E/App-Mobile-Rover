import { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Badge,
  BottomSheet,
  Button,
  Dialog,
  EmptyState,
  Icon,
  IconButton,
  Screen,
  SwipeDeck,
  SwipeDeckHandle,
} from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { canCreateTrip, useTrips } from '../contexts/TripsContext';
import { categoryIcons, categoryLabel, Destination, exploreDeck, getDestination, getPlacesByCity } from '../data/catalog';
import { AppTabScreenProps } from '../navigation/types';
import { radii, spacing } from '../tokens';
import { success, tap } from '../utils/haptics';
import { formatDecimal } from '../utils/route';

export function ExploreScreen({ navigation }: AppTabScreenProps<'Explore'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const { trips, seenIds, likedIds, swipe, undoSwipe, unlike, resetDeck, createTrip } = useTrips();
  const deckRef = useRef<SwipeDeckHandle>(null);
  const [lastSwiped, setLastSwiped] = useState<string | null>(null);
  const [details, setDetails] = useState<Destination | null>(null);
  const [likedOpen, setLikedOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);

  const deck = exploreDeck.filter((d) => !seenIds.includes(d.id));
  const liked = likedIds.map(getDestination).filter((d): d is Destination => Boolean(d));

  const handleSwipe = (item: Destination, isLike: boolean) => {
    swipe(item.id, isLike);
    setLastSwiped(item.id);
    if (isLike) {
      success();
      toast({ message: t('explore.saved', { name: item.name }), icon: 'heart', tone: 'success' });
    } else {
      tap();
    }
  };

  const handleUndo = () => {
    if (!lastSwiped) return;
    undoSwipe(lastSwiped);
    setLastSwiped(null);
    tap();
  };

  const planTrip = (destination: Destination) => {
    if (!canCreateTrip(trips, Boolean(user?.isPremium))) {
      setLikedOpen(false);
      setDetails(null);
      setLimitOpen(true);
      return;
    }
    const trip = createTrip(destination.id, user?.isPremium ? 3 : 1);
    setLikedOpen(false);
    setDetails(null);
    toast({ message: t('explore.planned', { name: destination.name }), icon: 'map-marker-path', tone: 'success' });
    navigation.navigate('TripDetail', { tripId: trip.id });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="h1">{t('explore.title')}</AppText>
          <AppText variant="body" tone="secondary">
            {t('explore.subtitle')}
          </AppText>
        </View>
        <IconButton
          icon="heart-outline"
          badge={liked.length}
          onPress={() => setLikedOpen(true)}
          accessibilityLabel={t('explore.liked')}
        />
      </View>

      <View style={styles.deckArea}>
        {deck.length ? (
          <SwipeDeck ref={deckRef} items={deck} onSwipe={handleSwipe} onInfo={setDetails} />
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="compass-outline"
              title={t('explore.allSeenTitle')}
              description={t('explore.allSeenText')}
            >
              <View style={styles.emptyActions}>
                <Button title={t('explore.seeLiked', { count: liked.length })} icon="heart" onPress={() => setLikedOpen(true)} />
                <Button title={t('explore.restart')} variant="secondary" icon="undo-variant" onPress={resetDeck} />
              </View>
            </EmptyState>
          </View>
        )}
      </View>

      {deck.length ? (
        <View style={styles.controls}>
          <IconButton
            icon="close"
            variant="danger"
            size={64}
            iconSize={30}
            onPress={() => deckRef.current?.swipe('left')}
            accessibilityLabel={t('explore.skip')}
          />
          <IconButton
            icon="undo-variant"
            variant="soft"
            size={46}
            disabled={!lastSwiped}
            onPress={handleUndo}
            accessibilityLabel={t('common.undo')}
          />
          <IconButton
            icon="heart"
            variant="success"
            size={64}
            iconSize={30}
            onPress={() => deckRef.current?.swipe('right')}
            accessibilityLabel={t('explore.want')}
          />
        </View>
      ) : null}

      <BottomSheet
        visible={Boolean(details)}
        title={details ? `${details.name}, ${details.country}` : ''}
        subtitle={details?.tagline}
        onClose={() => setDetails(null)}
        footer={details ? <Button title={t('explore.planTrip')} icon="map-marker-path" onPress={() => planTrip(details)} /> : null}
      >
        {details ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Image source={details.image} style={styles.detailImage} resizeMode="cover" />
            <AppText variant="body" tone="secondary">
              {details.description}
            </AppText>
            <View style={styles.detailFacts}>
              <Badge label={t('explore.rating', { value: formatDecimal(details.rating) })} icon="star" tone="accent" />
              <Badge label={details.bestSeason} icon="calendar-blank-outline" tone="primary" />
              <Badge label={'$'.repeat(details.budget)} icon="cash" tone="success" />
            </View>
            <AppText variant="overline" tone="tertiary" style={styles.detailSection}>
              {t('explore.highlights')}
            </AppText>
            {getPlacesByCity(details.id).map((place) => (
              <View key={place.id} style={[styles.highlight, { borderColor: colors.border }]}>
                <Icon name={categoryIcons[place.category]} size={18} color={colors.primaryText} />
                <AppText variant="body" style={styles.flex}>
                  {place.name}
                </AppText>
                <AppText variant="caption" tone="tertiary">
                  {categoryLabel(place.category)}
                </AppText>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={likedOpen}
        title={t('explore.liked')}
        subtitle={liked.length ? t('explore.likedText') : undefined}
        onClose={() => setLikedOpen(false)}
      >
        {liked.length ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {liked.map((destination) => (
              <View key={destination.id} style={[styles.likedRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Image source={destination.image} style={styles.likedImage} />
                <View style={styles.flex}>
                  <AppText variant="title">{destination.name}</AppText>
                  <AppText variant="caption" tone="tertiary">
                    {destination.country}
                  </AppText>
                </View>
                <IconButton
                  icon="heart-off-outline"
                  variant="soft"
                  size={36}
                  onPress={() => unlike(destination.id)}
                  accessibilityLabel={t('explore.removeLiked', { name: destination.name })}
                />
                <Button title={t('common.plan')} size="sm" onPress={() => planTrip(destination)} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.likedEmpty}>
            <EmptyState
              icon="heart-outline"
              title={t('explore.likedEmptyTitle')}
              description={t('explore.likedEmptyText')}
            />
          </View>
        )}
      </BottomSheet>

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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg },
  deckArea: { flex: 1, marginTop: spacing.xl, marginBottom: spacing.xl },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  emptyActions: { alignSelf: 'stretch', gap: spacing.md },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    marginBottom: spacing.xl,
  },
  detailImage: { width: '100%', height: 170, borderRadius: radii.lg, marginBottom: spacing.lg },
  detailFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  detailSection: { marginTop: spacing.xl, marginBottom: spacing.sm },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  likedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  likedImage: { width: 56, height: 56, borderRadius: radii.sm },
  likedEmpty: { paddingVertical: spacing.xxl },
});
