import { StyleSheet, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { premiumPrice } from '../data/content';
import { fonts, radii, spacing } from '../tokens';
import { AppText } from './AppText';
import { Badge } from './Chip';

export function PriceCard() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.card, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}>
      <View style={styles.header}>
        <AppText variant="title">Rover Premium</AppText>
        <Badge label={t('premium.monthly')} tone="accent" />
      </View>
      <View style={styles.priceRow}>
        <AppText style={[styles.price, { color: colors.text }]}>{premiumPrice()}</AppText>
        <AppText variant="body" tone="secondary" style={styles.period}>
          {t('premium.perMonth')}
        </AppText>
      </View>
      <AppText variant="bodySm" tone="secondary">
        {t('premium.cancelAnytime')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: radii.lg, padding: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.md, marginBottom: spacing.xs },
  price: { fontFamily: fonts.extraBold, fontSize: 36, lineHeight: 42, letterSpacing: -0.5 },
  period: { marginLeft: 4, marginBottom: 6 },
});
