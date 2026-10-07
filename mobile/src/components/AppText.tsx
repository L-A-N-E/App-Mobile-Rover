import { Text, TextProps } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { typography, TypographyVariant } from '../tokens';

type Tone = 'default' | 'secondary' | 'tertiary' | 'inverse' | 'primary' | 'accent' | 'danger' | 'success';

type Props = TextProps & {
  variant?: TypographyVariant;
  tone?: Tone;
  color?: string;
  align?: 'left' | 'center' | 'right';
};

export function AppText({ variant = 'body', tone = 'default', color, align, style, ...rest }: Props) {
  const { colors } = useTheme();
  const toneColor = {
    default: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    inverse: colors.textInverse,
    primary: colors.primaryText,
    accent: colors.accentText,
    danger: colors.danger,
    success: colors.success,
  }[tone];

  return <Text style={[typography[variant], { color: color ?? toneColor, textAlign: align }, style]} {...rest} />;
}
