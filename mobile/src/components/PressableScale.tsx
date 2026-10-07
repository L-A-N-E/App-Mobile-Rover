import { ReactNode, useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

// Pressable com leve efeito de "afundar" ao toque. O estilo vai direto no Pressable,
// para que flex/largura funcionem quando ele é filho de uma linha (ex.: botões lado a lado).
export function PressableScale({ children, style, scaleTo = 0.97, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 4 }).start();

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        animate(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animate(1);
        onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
