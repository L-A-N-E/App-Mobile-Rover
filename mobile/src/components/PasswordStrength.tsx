import { StyleSheet, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../tokens';
import { passwordRules, passwordStrength } from '../utils/validation';
import { AppText } from './AppText';
import { Icon } from './Icon';

// Barra de força + checklist das regras, atualizados enquanto o usuário digita.
export function PasswordStrength({ password }: { password: string }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { score, label } = passwordStrength(password);
  const scoreColors = ['transparent', colors.danger, colors.accent, colors.primary, colors.success];
  const color = scoreColors[score];

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        <View style={styles.bars}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.bar, { backgroundColor: i <= score ? color : colors.border }]} />
          ))}
        </View>
        <AppText variant="caption" color={score ? color : colors.textTertiary} style={styles.label}>
          {label || t('val.strength.label')}
        </AppText>
      </View>

      <View style={styles.rules}>
        {passwordRules.map((rule) => {
          const ok = rule.test(password);
          return (
            <View key={rule.id} style={styles.rule}>
              <Icon
                name={ok ? 'check-circle' : 'circle-outline'}
                size={15}
                color={ok ? colors.success : colors.textTertiary}
              />
              <AppText variant="caption" tone={ok ? 'success' : 'tertiary'}>
                {rule.label}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: -spacing.sm, marginBottom: spacing.lg },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { minWidth: 92, textAlign: 'right' },
  rules: { marginTop: spacing.sm, gap: 4 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
