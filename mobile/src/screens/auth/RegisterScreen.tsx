import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Icon, PasswordStrength, Screen, ScreenHeader, TextField } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthScreenProps } from '../../navigation/types';
import { radii, spacing } from '../../tokens';
import { tap } from '../../utils/haptics';
import { suggestEmail, validateEmail, validateName, validatePassword } from '../../utils/validation';

type Field = 'name' | 'email' | 'password' | 'confirm' | 'terms';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<{ field?: string; message: string } | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // Erros calculados a partir dos valores; só aparecem depois que o campo foi tocado ou no envio.
  const errors: Partial<Record<Field, string | null>> = {
    name: validateName(name),
    email: validateEmail(email) ?? (serverError?.field === 'email' ? serverError.message : null),
    password: validatePassword(password, { name, email }),
    confirm: !confirm ? t('register.confirmEmpty') : confirm !== password ? t('register.mismatch') : null,
    terms: acceptedTerms ? null : t('register.termsRequired'),
  };
  const show = (field: Field) => (touched[field] || submitted ? errors[field] ?? undefined : undefined);
  const blur = (field: Field) => setTouched((t) => ({ ...t, [field]: true }));
  const emailSuggestion = suggestEmail(email);

  const handleSubmit = async () => {
    setSubmitted(true);
    setServerError(null);
    const firstInvalid = (['name', 'email', 'password', 'confirm', 'terms'] as Field[]).find((f) => errors[f]);
    if (firstInvalid) {
      tap('medium');
      if (firstInvalid === 'email') emailRef.current?.focus();
      if (firstInvalid === 'password') passwordRef.current?.focus();
      if (firstInvalid === 'confirm') confirmRef.current?.focus();
      return;
    }
    setLoading(true);
    const result = await signUp(name, email, password);
    setLoading(false);
    if (!result.ok) setServerError({ field: result.field, message: result.error });
  };

  return (
    <Screen scroll>
      <ScreenHeader onBack={navigation.goBack} title={t('register.title')} subtitle={t('register.subtitle')} />

      <TextField
        label={t('register.name')}
        icon="account-outline"
        placeholder={t('register.namePlaceholder')}
        value={name}
        onChangeText={setName}
        onBlur={() => blur('name')}
        error={show('name')}
        valid={touched.name && !errors.name}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        submitBehavior="submit"
      />
      <TextField
        inputRef={emailRef}
        label={t('auth.email')}
        icon="email-outline"
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (serverError?.field === 'email') setServerError(null);
        }}
        onBlur={() => blur('email')}
        error={show('email')}
        valid={touched.email && !errors.email && !emailSuggestion}
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
        placeholder={t('register.passwordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        onFocus={() => setPasswordFocused(true)}
        onBlur={() => {
          setPasswordFocused(false);
          blur('password');
        }}
        error={show('password')}
        valid={touched.password && !errors.password}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        submitBehavior="submit"
      />
      {password || passwordFocused ? <PasswordStrength password={password} /> : null}

      <TextField
        inputRef={confirmRef}
        label={t('register.confirm')}
        icon="lock-check-outline"
        placeholder={t('register.confirmPlaceholder')}
        value={confirm}
        onChangeText={setConfirm}
        onBlur={() => blur('confirm')}
        error={show('confirm')}
        valid={Boolean(confirm) && confirm === password}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      <Pressable
        onPress={() => setAcceptedTerms((v) => !v)}
        style={styles.terms}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTerms }}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: show('terms') ? colors.danger : acceptedTerms ? colors.primary : colors.border,
              backgroundColor: acceptedTerms ? colors.primary : colors.surface,
            },
          ]}
        >
          {acceptedTerms ? <Icon name="check" size={14} color={colors.onPrimary} /> : null}
        </View>
        <AppText variant="bodySm" tone="secondary" style={styles.flex}>
          {t('register.acceptPrefix')}
          <AppText variant="bodySm" tone="primary">{t('register.termsOfUse')}</AppText>
          {t('register.acceptMiddle')}
          <AppText variant="bodySm" tone="primary">{t('register.privacy')}</AppText>.
        </AppText>
      </Pressable>
      {show('terms') ? (
        <AppText variant="caption" tone="danger" style={styles.termsError}>
          {show('terms')}
        </AppText>
      ) : null}

      {serverError && serverError.field !== 'email' ? (
        <View style={[styles.serverError, { backgroundColor: colors.dangerSoft }]}>
          <Icon name="alert-circle-outline" size={18} color={colors.danger} />
          <AppText variant="bodySm" tone="danger" style={styles.flex}>
            {serverError.message}
          </AppText>
        </View>
      ) : null}

      <Button title={t('register.submit')} onPress={handleSubmit} loading={loading} style={styles.submit} />

      <View style={styles.footer}>
        <AppText variant="body" tone="secondary">
          {t('register.hasAccount')}
        </AppText>
        <Pressable onPress={() => navigation.replace('Login')} hitSlop={8}>
          <AppText variant="label" tone="primary">
            {t('register.signIn')}
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  suggestion: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.xs },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  termsError: { marginTop: spacing.xs, marginLeft: 34 },
  serverError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  submit: { marginTop: spacing.xxl },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 'auto',
    paddingTop: spacing.xxxl,
  },
});
