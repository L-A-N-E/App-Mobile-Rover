import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { categoryIcons, categoryLabel, Place } from '../data/catalog';
import { radii, shadows, spacing } from '../tokens';
import { formatDuration } from '../utils/route';
import { AppText } from './AppText';
import { CoverImage } from './CoverImage';
import { Badge } from './Chip';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  place: Place;
  onPress?: () => void;
};

export function AttractionCard({ place, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      style={[
        styles.card,
        shadows.sm,
        { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: colors.primarySoft }]}>
        {place.image ? (
          <>
            <CoverImage source={place.image} />
            <LinearGradient colors={['rgba(29,100,158,0)', 'rgba(10,36,56,0.45)']} style={StyleSheet.absoluteFill} />
          </>
        ) : (
          <Icon name={categoryIcons[place.category]} size={28} color={colors.primaryText} />
        )}
      </View>

      <View style={styles.info}>
        <AppText variant="title" numberOfLines={2}>
          {place.name}
        </AppText>
        <View style={styles.meta}>
          <Badge label={categoryLabel(place.category)} tone="primary" />
          <View style={styles.duration}>
            <Icon name="clock-outline" size={13} color={colors.textTertiary} />
            <AppText variant="caption" tone="tertiary">
              {formatDuration(place.durationMin)}
            </AppText>
          </View>
        </View>
      </View>

      <View style={[styles.arrow, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name="chevron-right" size={22} color={colors.text} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: radii.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, paddingHorizontal: spacing.md, gap: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
});
