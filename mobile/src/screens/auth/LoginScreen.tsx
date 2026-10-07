import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Dialog, Icon, Screen, ScreenHeader, TextField } from '../../components';
import { DEMO_EMAIL, DEMO_PASSWORD, useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthScreenProps } from '../../navigation/types';
import { radii, spacing } from '../../tokens';
import { tap } from '../../utils/haptics';
import { suggestEmail, validateEmail } from '../../utils/validation';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false });
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const emailError = validateEmail(email);
  const passwordError = password ? null : t('val.pw.required');
  const emailSuggestion = suggestEmail(email);

  const handleSubmit = async () => {
    setSubmitted(true);
    setAuthError('');
    if (emailError || passwordError) {
      tap('medium');
      if (!emailError) passwordRef.current?.focus();
      return;
    }
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (!result.ok) {
      tap('medium');
      setAuthError(result.error);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setAuthError('');
  };

  return (
    <Screen scroll>
      <ScreenHeader
        onBack={navigation.goBack}
        title={t('login.title')}
        subtitle={t('login.subtitle')}
      />

      <TextField
        label={t('auth.email')}
        icon="email-outline"
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setAuthError('');
        }}
        onBlur={() => setTouched({ email: true })}
        error={(touched.email && email) || submitted ? (emailError ?? undefined) : undefined}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
        hint={
          emailSuggestion ? (
            <Pressable onPress={() => setEmail(emailSuggestion)} style={styles.suggestion} hitSlop={6}>
              <AppText variant="caption" tone="secondary">
                {t('common.didYouMean')}{' '}
              </AppText>
              <AppText variant="caption" tone="primary">
                {emailSuggestion}
              </AppText>
              <AppText variant="caption" tone="secondary">
                ?
              </AppText>
            </Pressable>
          ) : null
        }
      />
      <TextField
        inputRef={passwordRef}
        label={t('auth.password')}
        icon="lock-outline"
        placeholder={t('login.passwordPlaceholder')}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setAuthError('');
        }}
        error={submitted ? (passwordError ?? undefined) : undefined}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      <Pressable onPress={() => setForgotOpen(true)} style={styles.forgot} hitSlop={8}>
        <AppText variant="label" tone="primary">
          {t('login.forgot')}
        </AppText>
      </Pressable>

      {authError ? (
        <View style={[styles.authError, { backgroundColor: colors.dangerSoft }]} accessibilityLiveRegion="polite">
          <Icon name="alert-circle-outline" size={18} color={colors.danger} />
          <AppText variant="bodySm" tone="danger" style={styles.flex}>
            {authError}
          </AppText>
        </View>
      ) : null}

      <Button title={t('login.submit')} onPress={handleSubmit} loading={loading} style={styles.submit} />

      <Pressable onPress={fillDemo} style={[styles.demo, { backgroundColor: colors.primarySoft }]}>
        <Icon name="account-key-outline" size={18} color={colors.primaryText} />
        <AppText variant="bodySm" tone="primary" style={styles.flex}>
          {t('login.demo', { email: DEMO_EMAIL, password: DEMO_PASSWORD })}
        </AppText>
      </Pressable>

      <View style={styles.footer}>
        <AppText variant="body" tone="secondary">
          {t('login.noAccount')}
        </AppText>
        <Pressable onPress={() => navigation.replace('Register')} hitSlop={8}>
          <AppText variant="label" tone="primary">
            {t('login.signUp')}
          </AppText>
        </Pressable>
      </View>

      <Dialog
        visible={forgotOpen}
        icon="email-outline"
        title={t('login.forgotTitle')}
        message={t('login.forgotMessage')}
        cancelLabel={t('login.understood')}
        onCancel={() => setForgotOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  suggestion: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.xs },
  authError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  submit: { marginTop: spacing.xxl },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 'auto',
    paddingTop: spacing.xxxl,
  },
});
