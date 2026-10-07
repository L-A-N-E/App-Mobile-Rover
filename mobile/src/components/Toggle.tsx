import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
};

export function Toggle({ value, onValueChange, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, { toValue: value ? 1 : 0, useNativeDriver: false, speed: 20, bounciness: 6 }).start();
  }, [value, progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const backgroundColor = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.accent] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
    >
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
