import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Icon, IconButton, PriceCard } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { premiumBenefits } from '../data/content';
import { AppStackScreenProps } from '../navigation/types';
import { radii, spacing } from '../tokens';
import { success } from '../utils/haptics';

export function PremiumScreen({ navigation }: AppStackScreenProps<'Premium'>) {
  const { user, setPremium } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    setLoading(true);
    await setPremium(true); // Assinatura simulada localmente
    setLoading(false);
    success();
    toast({ message: t('premium.welcome'), icon: 'crown', tone: 'success' });
    navigation.goBack();
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient colors={['#0B2A4D', '#01448A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.glow} />
          <SafeAreaView edges={['top']} style={styles.heroBar}>
            <IconButton icon="close" variant="glass" size={40} onPress={navigation.goBack} accessibilityLabel={t('common.close')} />
          </SafeAreaView>
          <View style={styles.crown}>
            <Icon name="crown" size={34} color={colors.accent} />
          </View>
          <AppText variant="overline" color={colors.accent} align="center">
            Rover Premium
          </AppText>
          <AppText variant="h1" tone="inverse" align="center" style={styles.heroTitle}>
            {t('premium.title')}
          </AppText>
          <AppText variant="body" color="rgba(255,255,255,0.8)" align="center" style={styles.heroText}>
            {t('premium.text')}
          </AppText>
        </LinearGradient>

        <View style={styles.body}>
          {premiumBenefits().map((benefit) => (
            <View key={benefit.title} style={styles.benefit}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name={benefit.icon} size={22} color={colors.accentText} />
              </View>
              <View style={styles.flex}>
                <AppText variant="title">{benefit.title}</AppText>
                <AppText variant="bodySm" tone="secondary">
                  {benefit.text}
                </AppText>
              </View>
            </View>
          ))}

          <View style={styles.price}>
            <PriceCard />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {user?.isPremium ? (
          <Button title={t('premium.already')} icon="check" variant="secondary" disabled />
        ) : (
          <Button title={t('premium.subscribe')} variant="accent" icon="crown" loading={loading} onPress={subscribe} />
        )}
        <AppText variant="caption" tone="tertiary" align="center" style={styles.legal}>
          {t('premium.legal')}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.xxxl },
  hero: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    right: -80,
    top: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(244,155,103,0.16)',
  },
  heroBar: { alignItems: 'flex-end', paddingTop: spacing.sm },
  crown: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: { marginTop: spacing.sm },
  heroText: { marginTop: spacing.sm },
  body: { paddingHorizontal: spacing.screen, paddingTop: spacing.xxl, gap: spacing.lg },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitIcon: { width: 46, height: 46, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  price: { marginTop: spacing.sm },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
  legal: { marginTop: spacing.sm },
});
