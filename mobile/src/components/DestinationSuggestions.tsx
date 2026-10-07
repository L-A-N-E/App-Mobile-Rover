import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Destination, destinations } from '../data/catalog';
import { radii, shadows, spacing } from '../tokens';
import { AppText } from './AppText';
import { CoverImage } from './CoverImage';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  likedIds: string[];
  onSelect: (destination: Destination) => void;
  limit?: number;
};

// Destinos sugeridos para quem ainda não tem viagem: curtidos primeiro, depois os mais bem avaliados.
export function DestinationSuggestions({ likedIds, onSelect, limit = 6 }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const suggested = [...destinations]
    .sort((a, b) => Number(likedIds.includes(b.id)) - Number(likedIds.includes(a.id)) || b.rating - a.rating)
    .slice(0, limit);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.row}>
      {suggested.map((d) => (
        <View key={d.id} style={[styles.shadow, shadows.sm, { shadowColor: colors.shadow }]}>
          <PressableScale
            onPress={() => onSelect(d)}
            accessibilityRole="button"
            accessibilityLabel={t('suggestions.planA11y', { name: d.name })}
            style={styles.card}
          >
            <CoverImage source={d.image} />
            <LinearGradient
              colors={['rgba(8,18,30,0)', 'rgba(8,18,30,0.88)']}
              locations={[0.35, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.content}>
              {likedIds.includes(d.id) ? (
                <View style={[styles.liked, { backgroundColor: colors.accent }]}>
                  <Icon name="heart" size={12} color="#FFFFFF" />
                </View>
              ) : (
                <View />
              )}
              <View>
                <AppText variant="title" tone="inverse" numberOfLines={1}>
                  {d.name}
                </AppText>
                <AppText variant="caption" color="rgba(255,255,255,0.85)" numberOfLines={2}>
                  {d.tagline}
                </AppText>
                <View style={styles.cta}>
                  <Icon name="plus-circle-outline" size={14} color="#FFFFFF" />
                  <AppText variant="caption" color="#FFFFFF">
                    {t('common.plan')}
                  </AppText>
                </View>
              </View>
            </View>
          </PressableScale>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -spacing.screen, flexGrow: 0 },
  row: { gap: spacing.md, paddingHorizontal: spacing.screen, paddingBottom: spacing.sm },
  shadow: { borderRadius: radii.lg },
  card: { width: 168, height: 220, borderRadius: radii.lg, overflow: 'hidden' },
  content: { flex: 1, justifyContent: 'space-between', padding: spacing.md },
  liked: { alignSelf: 'flex-end', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
});
