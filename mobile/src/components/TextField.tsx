import { ReactNode, Ref, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { fonts, radii, sizes, spacing } from '../tokens';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

type Props = TextInputProps & {
  label?: string;
  icon?: IconName;
  error?: string;
  valid?: boolean; // mostra um check verde quando o campo está correto
  hint?: ReactNode; // conteúdo extra abaixo do campo (ex.: sugestão de email)
  inputRef?: Ref<TextInput>;
};

export function TextField({ label, icon, error, valid, hint, inputRef, secureTextEntry, style, onFocus, onBlur, ...rest }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : valid ? colors.success : colors.border;

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          { backgroundColor: colors.surface, borderColor, borderWidth: focused || error ? 1.5 : 1 },
        ]}
      >
        {icon ? <Icon name={icon} size={20} color={focused ? colors.primaryText : colors.textTertiary} /> : null}
        <TextInput
          ref={inputRef}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={hidden}
          selectionColor={colors.primary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: colors.text }, style]}
          {...rest}
        />
        {valid && !error ? <Icon name="check-circle" size={18} color={colors.success} /> : null}
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityLabel={hidden ? t('common.showPassword') : t('common.hidePassword')}>
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <Icon name="alert-circle-outline" size={14} color={colors.danger} />
          <AppText variant="caption" tone="danger" style={styles.flex}>
            {error}
          </AppText>
        </View>
      ) : null}
      {hint}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm },
  field: {
    height: sizes.input,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: 15,
    // remove o contorno azul padrão no web
    outlineStyle: 'none',
  } as object,
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: spacing.xs },
  flex: { flex: 1 },
});
