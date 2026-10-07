import { LinearGradient } from 'expo-linear-gradient';
import { Ref, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Destination } from '../data/catalog';
import { fonts, radii, shadows, spacing } from '../tokens';
import { formatDecimal } from '../utils/route';
import { AppText } from './AppText';
import { CoverImage } from './CoverImage';
import { Badge } from './Chip';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

export type SwipeDeckHandle = {
  swipe: (direction: 'left' | 'right') => void;
};

type Props = {
  items: Destination[];
  onSwipe: (item: Destination, liked: boolean) => void;
  onInfo: (item: Destination) => void;
  ref?: Ref<SwipeDeckHandle>;
};

const SWIPE_OUT_MS = 260;

// Deck estilo Tinder: arraste para a direita para curtir e para a esquerda para pular.
export function SwipeDeck({ items, onSwipe, onInfo, ref }: Props) {
  const { width } = useWindowDimensions();
  const threshold = width * 0.25;
  const position = useRef(new Animated.ValueXY()).current;
  const animating = useRef(false);

  // Mantém as referências mais recentes para o PanResponder (criado uma única vez).
  const latest = useRef({ items, onSwipe, width, threshold });
  latest.current = { items, onSwipe, width, threshold };

  const top = items[0];

  // Quando o card do topo muda, o novo card começa centralizado (antes da pintura, sem "piscar").
  useLayoutEffect(() => {
    position.setValue({ x: 0, y: 0 });
    animating.current = false;
  }, [top?.id, position]);

  const flyOut = (direction: 'left' | 'right', vy = 0) => {
    const { items: current, onSwipe: handler, width: w } = latest.current;
    const item = current[0];
    if (!item || animating.current) return;
    animating.current = true;
    Animated.timing(position, {
      toValue: { x: (direction === 'right' ? 1 : -1) * w * 1.4, y: vy * 120 },
      duration: SWIPE_OUT_MS,
      useNativeDriver: false,
    }).start(() => handler(item, direction === 'right'));
  };

  useImperativeHandle(ref, () => ({ swipe: (direction) => flyOut(direction) }));

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => !animating.current && (Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6),
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        const { threshold: t } = latest.current;
        if (g.dx > t || g.vx > 0.8) flyOut('right', g.vy);
        else if (g.dx < -t || g.vx < -0.8) flyOut('left', g.vy);
        else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    }),
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-14deg', '0deg', '14deg'],
  });
  const likeOpacity = position.x.interpolate({ inputRange: [0, threshold], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = position.x.interpolate({ inputRange: [-threshold, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const nextScale = position.x.interpolate({
    inputRange: [-threshold, 0, threshold],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });
  const nextTranslate = position.x.interpolate({
    inputRange: [-threshold, 0, threshold],
    outputRange: [0, 18, 0],
    extrapolate: 'clamp',
  });

  const visible = items.slice(0, 3);

  return (
    <View style={styles.deck}>
      {visible
        .map((item, index) => {
          const isTop = index === 0;
          const animatedStyle = isTop
            ? { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }
            : index === 1
              ? { transform: [{ translateY: nextTranslate }, { scale: nextScale }] }
              : { transform: [{ translateY: 36 }, { scale: 0.88 }], opacity: 0.6 };

          return (
            <Animated.View
              key={item.id}
              style={[StyleSheet.absoluteFill, animatedStyle]}
              {...(isTop ? panResponder.panHandlers : {})}
            >
              <DestinationCard
                item={item}
                onInfo={() => onInfo(item)}
                likeOpacity={isTop ? likeOpacity : undefined}
                nopeOpacity={isTop ? nopeOpacity : undefined}
              />
            </Animated.View>
          );
        })
        .reverse()}
    </View>
  );
}

type CardProps = {
  item: Destination;
  onInfo: () => void;
  likeOpacity?: Animated.AnimatedInterpolation<number>;
  nopeOpacity?: Animated.AnimatedInterpolation<number>;
};

function DestinationCard({ item, onInfo, likeOpacity, nopeOpacity }: CardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.card, shadows.lg, { backgroundColor: colors.surfaceAlt, shadowColor: colors.shadow }]}>
      <CoverImage source={item.image} />
      <LinearGradient
        colors={['rgba(8,18,30,0.35)', 'rgba(8,18,30,0)', 'rgba(8,18,30,0.15)', 'rgba(8,18,30,0.92)']}
        locations={[0, 0.25, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.cardTop}>
        <Badge label={formatDecimal(item.rating)} icon="star" tone="glass" />
        <IconButton icon="information-outline" variant="glass" size={38} onPress={onInfo} accessibilityLabel={t('swipe.details')} />
      </View>

      {likeOpacity ? (
        <Animated.View style={[styles.stamp, styles.stampLike, { borderColor: colors.success, opacity: likeOpacity }]}>
          <AppText style={[styles.stampText, { color: colors.success }]}>{t('swipe.like')}</AppText>
        </Animated.View>
      ) : null}
      {nopeOpacity ? (
        <Animated.View style={[styles.stamp, styles.stampNope, { borderColor: colors.danger, opacity: nopeOpacity }]}>
          <AppText style={[styles.stampText, { color: colors.danger }]}>{t('swipe.nope')}</AppText>
        </Animated.View>
      ) : null}

      <View style={styles.cardBottom}>
        <View style={styles.location}>
          <Icon name="map-marker-outline" size={16} color="rgba(255,255,255,0.85)" />
          <AppText variant="label" color="rgba(255,255,255,0.85)">
            {item.country}
          </AppText>
        </View>
        <AppText variant="hero" tone="inverse">
          {item.name}
        </AppText>
        <AppText variant="body" color="rgba(255,255,255,0.9)" style={styles.tagline}>
          {item.tagline}
        </AppText>
        <View style={styles.tags}>
          {item.tags.map((tag) => (
            <Badge key={tag} label={tag} tone="glass" />
          ))}
        </View>
        <View style={styles.facts}>
          <Fact icon="calendar-blank-outline" label={item.bestSeason} />
          <Fact icon="cash" label={'$'.repeat(item.budget) + '·'.repeat(3 - item.budget)} />
        </View>
      </View>
    </View>
  );
}

function Fact({ icon, label }: { icon: 'calendar-blank-outline' | 'cash'; label: string }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} size={15} color="rgba(255,255,255,0.75)" />
      <AppText variant="caption" color="rgba(255,255,255,0.85)">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  // no web, evita selecionar textos da página enquanto arrasta o card
  deck: { flex: 1, ...(Platform.OS === 'web' ? ({ userSelect: 'none' } as object) : null) },
  card: { flex: 1, borderRadius: radii.xl, overflow: 'hidden', justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  cardBottom: { padding: spacing.xl, paddingTop: 0 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  tagline: { marginTop: spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  facts: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stamp: {
    position: 'absolute',
    top: 72,
    borderWidth: 4,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  stampLike: { left: spacing.xl, transform: [{ rotate: '-14deg' }] },
  stampNope: { right: spacing.xl, transform: [{ rotate: '14deg' }] },
  stampText: { fontFamily: fonts.extraBold, fontSize: 30, lineHeight: 36, letterSpacing: 1.5 },
});
