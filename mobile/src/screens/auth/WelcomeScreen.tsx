import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Icon, IconButton } from '../../components';
import { useI18n } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LANGUAGES } from '../../i18n';
import { AuthScreenProps } from '../../navigation/types';
import { fonts, spacing } from '../../tokens';

export function WelcomeScreen({ navigation }: AuthScreenProps<'Welcome'>) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const nextLanguage = () => setLanguage(LANGUAGES[(LANGUAGES.indexOf(language) + 1) % LANGUAGES.length]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={require('../../../assets/images/inicio-praia.jpg')} style={styles.image} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(8,18,30,0.45)', 'rgba(8,18,30,0)', colors.background]}
        locations={[0, 0.3, 0.68]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <Image source={require('../../../assets/images/logo-mark.png')} style={styles.logo} resizeMode="contain" />
            <AppText style={styles.brandText} color="#FFFFFF">
              ROVER
            </AppText>
          </View>
          <View style={styles.topActions}>
            <Pressable onPress={nextLanguage} accessibilityRole="button" accessibilityLabel={t('welcome.language')} style={styles.languagePill}>
              <Icon name="translate" size={16} color="#FFFFFF" />
              <AppText variant="label" color="#FFFFFF">
                {language.toUpperCase()}
              </AppText>
            </Pressable>
            <IconButton
              icon={isDark ? 'white-balance-sunny' : 'weather-night'}
              variant="glass"
              size={40}
              onPress={toggleTheme}
              accessibilityLabel={t('welcome.toggleTheme')}
            />
          </View>
        </View>

        <View style={styles.content}>
          <AppText variant="overline" tone="accent">
            {t('welcome.eyebrow')}
          </AppText>
          <AppText variant="hero" style={styles.title}>
            {t('welcome.title')}
          </AppText>
          <AppText variant="body" tone="secondary" style={styles.subtitle}>
            {t('welcome.text')}
          </AppText>

          <View style={styles.actions}>
            <Button title={t('welcome.signIn')} onPress={() => navigation.navigate('Login')} />
            <Button title={t('welcome.signUp')} variant="accent" onPress={() => navigation.navigate('Register')} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { position: 'absolute', top: 0, left: 0, width: '100%', height: '68%' },
  safe: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    // mesmo visual "glass" do IconButton ao lado
    backgroundColor: 'rgba(10, 20, 32, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logo: { width: 40, height: 40 },
  brandText: { fontFamily: fonts.extraBold, fontSize: 20, letterSpacing: 2 },
  content: { paddingHorizontal: spacing.screen, paddingBottom: spacing.lg },
  title: { marginTop: spacing.sm },
  subtitle: { marginTop: spacing.md },
  actions: { gap: spacing.md, marginTop: spacing.xxxl },
});
