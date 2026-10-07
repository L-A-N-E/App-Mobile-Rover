import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { shadows, sizes } from '../tokens';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';

type Variant = 'surface' | 'soft' | 'primary' | 'accent' | 'glass' | 'danger' | 'success';

type Props = {
  icon: IconName;
  onPress?: () => void;
  variant?: Variant;
  size?: number;
  iconSize?: number;
  badge?: number;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  onPress,
  variant = 'surface',
  size = sizes.iconButton,
  iconSize,
  badge,
  disabled,
  accessibilityLabel,
  style,
}: Props) {
  const { colors } = useTheme();

  const look: Record<Variant, { bg: string; fg: string; border?: string; elevated?: boolean }> = {
    surface: { bg: colors.surface, fg: colors.text, border: colors.border },
    soft: { bg: colors.surfaceAlt, fg: colors.text },
    primary: { bg: colors.primary, fg: colors.onPrimary },
    accent: { bg: colors.accent, fg: '#FFFFFF' },
    glass: { bg: 'rgba(10, 20, 32, 0.38)', fg: '#FFFFFF', border: 'rgba(255,255,255,0.25)' },
    danger: { bg: colors.surface, fg: colors.danger, elevated: true },
    success: { bg: colors.surface, fg: colors.success, elevated: true },
  };
  const { bg, fg, border, elevated } = look[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      scaleTo={0.92}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, opacity: disabled ? 0.4 : 1 },
        border ? { borderWidth: 1, borderColor: border } : null,
        elevated ? [shadows.lg, { shadowColor: colors.shadow }] : null,
        style,
      ]}
    >
      <Icon name={icon} size={iconSize ?? Math.round(size * 0.48)} color={fg} />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.background }]}>
          <AppText variant="caption" color="#FFFFFF" style={styles.badgeText}>
            {badge > 9 ? '9+' : badge}
          </AppText>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, lineHeight: 12 },
});
