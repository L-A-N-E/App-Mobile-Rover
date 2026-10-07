import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { fonts, radii, spacing } from '../tokens';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <AppText variant="h3">{title}</AppText>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <AppText variant="label" tone="primary">
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accent }]}>
      <AppText color="#FFFFFF" style={{ fontFamily: fonts.bold, fontSize: size * 0.38 }}>
        {initials || '?'}
      </AppText>
    </View>
  );
}

type EmptyProps = { icon: IconName; title: string; description: string; children?: ReactNode };

export function EmptyState({ icon, title, description, children }: EmptyProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Icon name={icon} size={34} color={colors.primaryText} />
      </View>
      <AppText variant="h3" align="center">
        {title}
      </AppText>
      <AppText variant="body" tone="secondary" align="center" style={styles.emptyText}>
        {description}
      </AppText>
      {children}
    </View>
  );
}

type StatProps = { icon: IconName; value: string; label: string };

export function Stat({ icon, value, label }: StatProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Icon name={icon} size={18} color={colors.primaryText} />
      <AppText variant="h3" style={styles.statValue}>
        {value}
      </AppText>
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: { marginTop: spacing.sm, marginBottom: spacing.xl },
  stat: { flex: 1, borderWidth: 1, borderRadius: radii.md, padding: spacing.md, gap: 2 },
  statValue: { marginTop: spacing.xs },
});
