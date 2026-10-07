import { ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Avatar,
  Badge,
  BottomSheet,
  Button,
  Dialog,
  Icon,
  IconName,
  PremiumBanner,
  Screen,
  SegmentedControl,
  Stat,
  Toggle,
} from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/LanguageContext';
import { ThemePreference, useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useTrips } from '../contexts/TripsContext';
import { premiumPrice } from '../data/content';
import { Language, LANGUAGES, languageNames, t as tModule } from '../i18n';
import { AppTabScreenProps } from '../navigation/types';
import {
  ensurePermission,
  getNotificationsEnabled,
  notificationsSupported,
  setNotificationsEnabled,
} from '../services/notifications';
import { radii, spacing } from '../tokens';

type SettingRowProps = { icon: IconName; label: string; children?: ReactNode; last?: boolean; onPress?: () => void };

function SettingRow({ icon, label, children, last, onPress }: SettingRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && { opacity: 0.6 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name={icon} size={18} color={colors.text} />
      </View>
      <AppText variant="title" style={styles.flex}>
        {label}
      </AppText>
      {children}
    </Pressable>
  );
}

export function ProfileScreen({ navigation }: AppTabScreenProps<'Profile'>) {
  const { user, setPremium, signOut } = useAuth();
  const { trips, likedIds } = useTrips();
  const { colors, preference, setPreference } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const toast = useToast();
  const [notifications, setNotifications] = useState(true);
  const [languageOpen, setLanguageOpen] = useState(false);

  const chooseLanguage = (next: Language) => {
    setLanguageOpen(false);
    if (next === language) return;
    setLanguage(next);
    // já no novo idioma: o t do módulo foi atualizado pelo setLanguage
    toast({ message: tModule('profile.languageChanged'), icon: 'translate', tone: 'success' });
  };

  useEffect(() => {
    getNotificationsEnabled().then(setNotifications);
  }, []);

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled && notificationsSupported && !(await ensurePermission())) {
      toast({ message: t('profile.notifDenied'), icon: 'bell-off-outline', tone: 'danger' });
      return;
    }
    setNotifications(enabled);
    await setNotificationsEnabled(enabled);
    toast({
      message: enabled ? t('profile.notifOn') : t('profile.notifOff'),
      icon: enabled ? 'bell-ring-outline' : 'bell-off-outline',
    });
  };
  const [cancelOpen, setCancelOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const stops = trips.reduce((acc, t) => acc + t.itinerary.flat().length, 0);

  return (
    <Screen scroll>
      <View style={styles.identity}>
        <Avatar name={user?.name ?? ''} size={88} />
        <AppText variant="h2" style={styles.name}>
          {user?.name}
        </AppText>
        <AppText variant="body" tone="secondary">
          {user?.email}
        </AppText>
        <View style={styles.plan}>
          {user?.isPremium ? (
            <Badge label={t('profile.member')} icon="crown" tone="accent" />
          ) : (
            <Badge label={t('profile.free')} icon="account-outline" tone="neutral" />
          )}
        </View>
      </View>

      <View style={styles.stats}>
        <Stat icon="bag-suitcase-outline" value={String(trips.length)} label={t('profile.trips')} />
        <Stat icon="heart-outline" value={String(likedIds.length)} label={t('profile.liked')} />
        <Stat icon="map-marker-outline" value={String(stops)} label={t('profile.stops')} />
      </View>

      {!user?.isPremium ? (
        <View style={styles.section}>
          <PremiumBanner
            title={t('profile.bannerTitle', { price: premiumPrice() })}
            description={t('profile.bannerText')}
            ctaLabel={t('premium.subscribe')}
            onPress={() => navigation.navigate('Premium')}
          />
        </View>
      ) : null}

      <AppText variant="overline" tone="tertiary" style={styles.groupTitle}>
        {t('profile.preferences')}
      </AppText>
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SettingRow icon="bell-outline" label={t('profile.weatherAlerts')}>
          <Toggle value={notifications} onValueChange={toggleNotifications} accessibilityLabel={t('profile.weatherAlerts')} />
        </SettingRow>
        <SettingRow icon="translate" label={t('profile.language')} onPress={() => setLanguageOpen(true)}>
          <AppText variant="bodySm" tone="tertiary">
            {languageNames[language]}
          </AppText>
          <Icon name="chevron-right" size={20} color={colors.textTertiary} />
        </SettingRow>
        <View style={styles.themeRow}>
          <View style={styles.themeLabel}>
            <View style={[styles.rowIcon, { backgroundColor: colors.surfaceAlt }]}>
              <Icon name="theme-light-dark" size={18} color={colors.text} />
            </View>
            <AppText variant="title">{t('profile.appearance')}</AppText>
          </View>
          <SegmentedControl<ThemePreference>
            value={preference}
            onChange={setPreference}
            options={[
              { value: 'system', label: t('profile.system'), icon: 'cellphone' },
              { value: 'light', label: t('profile.light'), icon: 'white-balance-sunny' },
              { value: 'dark', label: t('profile.dark'), icon: 'weather-night' },
            ]}
          />
        </View>
      </View>

      {user?.isPremium ? (
        <>
          <AppText variant="overline" tone="tertiary" style={styles.groupTitle}>
            {t('profile.subscription')}
          </AppText>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingRow icon="crown-outline" label={t('profile.monthlyPlan')} last>
              <Button title={t('common.cancel')} size="sm" variant="danger" onPress={() => setCancelOpen(true)} />
            </SettingRow>
          </View>
        </>
      ) : null}

      <Button title={t('profile.logout')} variant="outline" icon="logout" onPress={() => setLogoutOpen(true)} style={styles.logout} />
      <AppText variant="caption" tone="tertiary" align="center" style={styles.version}>
        {t('profile.version')}
      </AppText>

      <Dialog
        visible={cancelOpen}
        tone="danger"
        icon="crown-outline"
        title={t('profile.cancelTitle')}
        message={t('profile.cancelMessage')}
        confirmLabel={t('profile.cancelPlan')}
        cancelLabel={t('profile.keep')}
        onConfirm={() => {
          setCancelOpen(false);
          setPremium(false);
          toast({ message: t('profile.canceled'), icon: 'information-outline' });
        }}
        onCancel={() => setCancelOpen(false)}
      />
      <Dialog
        visible={logoutOpen}
        icon="logout"
        title={t('profile.logoutTitle')}
        message={t('profile.logoutMessage')}
        confirmLabel={t('profile.logoutConfirm')}
        onConfirm={() => {
          setLogoutOpen(false);
          signOut();
        }}
        onCancel={() => setLogoutOpen(false)}
      />

      <BottomSheet
        visible={languageOpen}
        title={t('profile.languageTitle')}
        subtitle={t('profile.languageText')}
        onClose={() => setLanguageOpen(false)}
      >
        {LANGUAGES.map((option) => {
          const selected = option === language;
          return (
            <Pressable
              key={option}
              onPress={() => chooseLanguage(option)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.languageOption,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : pressed ? colors.surfaceAlt : colors.surface,
                },
              ]}
            >
              <AppText variant="overline" tone={selected ? 'primary' : 'tertiary'} style={styles.languageCode}>
                {option}
              </AppText>
              <AppText variant="title" style={styles.flex}>
                {languageNames[option]}
              </AppText>
              <Icon
                name={selected ? 'check-circle' : 'circle-outline'}
                size={22}
                color={selected ? colors.primary : colors.textTertiary}
              />
            </Pressable>
          );
        })}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  identity: { alignItems: 'center', paddingTop: spacing.xxl },
  name: { marginTop: spacing.md },
  plan: { marginTop: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxl },
  section: { marginTop: spacing.xxl },
  groupTitle: { marginTop: spacing.xxl, marginBottom: spacing.sm, marginLeft: spacing.xs },
  group: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, minHeight: 60 },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  themeRow: { paddingVertical: spacing.md, gap: spacing.md },
  themeLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logout: { marginTop: spacing.xxxl },
  version: { marginTop: spacing.lg },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  languageCode: { width: 28 },
});
