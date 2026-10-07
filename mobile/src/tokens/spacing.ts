import { Platform, ViewStyle } from 'react-native';

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screen: 20,
};

export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const sizes = {
  button: 52,
  buttonSm: 40,
  input: 54,
  iconButton: 44,
};

const shadow = (height: number, radius: number, opacity: number, elevation: number): ViewStyle =>
  Platform.select<ViewStyle>({
    web: { boxShadow: `0px ${height}px ${radius * 2}px rgba(11, 27, 46, ${opacity})` } as ViewStyle,
    default: {
      shadowOffset: { width: 0, height },
      shadowRadius: radius,
      shadowOpacity: opacity,
      elevation,
    },
  }) as ViewStyle;

export const shadows = {
  sm: shadow(1, 3, 0.06, 1),
  md: shadow(4, 10, 0.08, 3),
  lg: shadow(10, 20, 0.14, 8),
};
