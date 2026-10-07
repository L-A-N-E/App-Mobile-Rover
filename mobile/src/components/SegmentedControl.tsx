import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { fonts, radii, shadows } from '../tokens';
import { Icon, IconName } from './Icon';

type Option<T extends string> = { value: T; label: string; icon?: IconName };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceAlt }]}>
      {options.map((option) => {
        const selected = option.value === value;
        const fg = selected ? colors.text : colors.textSecondary;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.segment,
              selected && [styles.selected, shadows.sm, { backgroundColor: colors.surface, shadowColor: colors.shadow }],
            ]}
          >
            {option.icon ? <Icon name={option.icon} size={16} color={fg} /> : null}
            <Text style={[styles.label, { color: fg }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: radii.sm, padding: 4 },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: radii.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  selected: {},
  label: { fontFamily: fonts.semiBold, fontSize: 13 },
});
