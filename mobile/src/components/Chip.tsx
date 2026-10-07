import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { fonts, radii, spacing } from '../tokens';
import { Icon, IconName } from './Icon';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
};

export function Chip({ label, selected, onPress, icon }: Props) {
  const { colors } = useTheme();
  const fg = selected ? colors.onPrimary : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {icon ? <Icon name={icon} size={16} color={fg} /> : null}
        <Text style={[styles.text, { color: fg }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

type BadgeProps = {
  label: string;
  icon?: IconName;
  tone?: 'neutral' | 'primary' | 'accent' | 'success' | 'glass';
};

export function Badge({ label, icon, tone = 'neutral' }: BadgeProps) {
  const { colors } = useTheme();
  const look = {
    neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
    primary: { bg: colors.primarySoft, fg: colors.primaryText },
    accent: { bg: colors.accentSoft, fg: colors.accentText },
    success: { bg: colors.successSoft, fg: colors.success },
    glass: { bg: 'rgba(8,18,30,0.55)', fg: '#FFFFFF' },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: look.bg }]}>
      {icon ? <Icon name={icon} size={13} color={look.fg} /> : null}
      <Text style={[styles.badgeText, { color: look.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 38,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontFamily: fonts.semiBold, fontSize: 13 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.semiBold, fontSize: 11 },
});
