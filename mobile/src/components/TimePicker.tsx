import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { fonts, radii, spacing } from '../tokens';
import { tap } from '../utils/haptics';
import { AppText } from './AppText';
import { Chip } from './Chip';
import { IconButton } from './IconButton';

type Props = {
  value: number; // minutos desde 00:00
  onChange: (minutes: number) => void;
  minuteStep?: number;
};

const DAY = 24 * 60;
const PRESETS = [8, 9, 10, 12, 14, 16, 18, 20].map((h) => h * 60);
const pad = (n: number) => String(n).padStart(2, '0');

// Seletor de horário com setas para hora e minuto, mais atalhos de horários comuns.
export function TimePicker({ value, onChange, minuteStep = 5 }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const hour = Math.floor(value / 60);
  const minute = value % 60;

  const shift = (delta: number) => {
    onChange((((value + delta) % DAY) + DAY) % DAY);
    tap();
  };

  const column = (label: string, text: string, step: number) => (
    <View style={styles.column}>
      <IconButton icon="chevron-up" variant="soft" size={44} onPress={() => shift(step)} accessibilityLabel={t('time.increase', { unit: label })} />
      <Text style={[styles.digits, { color: colors.text }]} accessibilityLabel={`${label}: ${text}`}>
        {text}
      </Text>
      <IconButton icon="chevron-down" variant="soft" size={44} onPress={() => shift(-step)} accessibilityLabel={t('time.decrease', { unit: label })} />
    </View>
  );

  return (
    <View>
      <View style={[styles.clock, { backgroundColor: colors.surfaceAlt }]}>
        {column(t('time.hour'), pad(hour), 60)}
        <Text style={[styles.digits, { color: colors.textTertiary }]}>:</Text>
        {column(t('time.minutes'), pad(minute), minuteStep)}
      </View>
      <AppText variant="overline" tone="tertiary" style={styles.presetsTitle}>
        {t('time.presets')}
      </AppText>
      <View style={styles.presets}>
        {PRESETS.map((m) => (
          <Chip key={m} label={`${pad(m / 60)}:00`} selected={m === value} onPress={() => onChange(m)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
  },
  column: { alignItems: 'center', gap: spacing.sm },
  digits: { fontFamily: fonts.extraBold, fontSize: 44, lineHeight: 52, minWidth: 64, textAlign: 'center' },
  presetsTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
