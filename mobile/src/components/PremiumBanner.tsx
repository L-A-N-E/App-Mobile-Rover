import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { radii, shadows, spacing } from '../tokens';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon } from './Icon';

type Props = {
  title: string;
  description: string;
  ctaLabel?: string;
  onPress?: () => void;
};

// Card azul-marinho com CTA laranja para upsell do Premium.
export function PremiumBanner({ title, description, ctaLabel, onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <LinearGradient
      colors={['#0B2A4D', '#01448A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.md, { shadowColor: colors.shadow }]}
    >
      <View style={styles.glow} />
      <View style={styles.iconWrap}>
        <Icon name="crown" size={22} color={colors.accent} />
      </View>
      <AppText variant="h3" tone="inverse" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="bodySm" color="rgba(255,255,255,0.8)" style={styles.description}>
        {description}
      </AppText>
      <Button title={ctaLabel ?? t('premium.knowMore')} variant="accent" icon="arrow-right" iconPosition="right" onPress={onPress} style={styles.button} />
    </LinearGradient>
  );
}

type GateProps = {
  icon: 'chat-processing-outline' | 'crown';
  title: string;
  description: string;
  onPress?: () => void;
};

// Estado bloqueado de uma funcionalidade Premium (ex.: Chat).
export function PremiumGate({ icon, title, description, onPress }: GateProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={styles.gate}>
      <View style={[styles.gateIcon, { backgroundColor: colors.accentSoft }]}>
        <Icon name={icon} size={36} color={colors.accentText} />
      </View>
      <AppText variant="h2" align="center">
        {title}
      </AppText>
      <AppText variant="body" tone="secondary" align="center" style={styles.gateText}>
        {description}
      </AppText>
      <Button title={t('premium.subscribePremium')} variant="accent" icon="crown" onPress={onPress} style={styles.gateButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl, padding: spacing.xl, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(244,155,103,0.18)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: spacing.md },
  description: { marginTop: spacing.xs },
  button: { marginTop: spacing.lg, alignSelf: 'flex-start' },
  gate: { alignItems: 'center', paddingHorizontal: spacing.lg },
  gateIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  gateText: { marginTop: spacing.sm, marginBottom: spacing.xxl },
  gateButton: { alignSelf: 'stretch' },
});
