import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '../components/Icon';
import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { fonts, radii, shadows, spacing } from '../tokens';
import { tap } from '../utils/haptics';
import { AppTabParamList } from './types';

const tabs: Record<keyof AppTabParamList, { icon: IconName; activeIcon: IconName }> = {
  Home: { icon: 'home-variant-outline', activeIcon: 'home-variant' },
  Explore: { icon: 'cards-outline', activeIcon: 'cards' },
  Trips: { icon: 'bag-suitcase-outline', activeIcon: 'bag-suitcase' },
  Chat: { icon: 'chat-processing-outline', activeIcon: 'chat-processing' },
  Profile: { icon: 'account-outline', activeIcon: 'account' },
};

const INDICATOR_WIDTH = 28;
const BAR_PADDING = spacing.sm;
const spring = { useNativeDriver: true, speed: 18, bounciness: 6 } as const;

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [tabWidth, setTabWidth] = useState(0);
  const slide = useRef(new Animated.Value(state.index)).current;

  // Indicador no topo da barra desliza até a aba ativa.
  useEffect(() => {
    Animated.spring(slide, { toValue: state.index, ...spring }).start();
  }, [state.index, slide]);

  const onLayout = (e: LayoutChangeEvent) => {
    setTabWidth((e.nativeEvent.layout.width - BAR_PADDING * 2) / state.routes.length);
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.bar,
        shadows.lg,
        {
          backgroundColor: colors.tabBar,
          // no escuro, borda mais clara para a barra se destacar do fundo
          borderColor: isDark ? '#2A4262' : colors.border,
          shadowColor: colors.shadow,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      {tabWidth ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              backgroundColor: colors.primary,
              transform: [
                {
                  translateX: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      BAR_PADDING + (tabWidth - INDICATOR_WIDTH) / 2,
                      BAR_PADDING + (tabWidth - INDICATOR_WIDTH) / 2 + tabWidth,
                    ],
                    extrapolate: 'extend',
                  }),
                },
              ],
            },
          ]}
        />
      ) : null}

      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const name = route.name as keyof AppTabParamList;
        const config = tabs[name];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            tap();
            navigation.navigate(route.name, route.params);
          }
        };

        return <TabItem key={route.key} label={t(`tabs.${name}`)} icon={config.icon} activeIcon={config.activeIcon} focused={focused} onPress={onPress} />;
      })}
    </View>
  );
}

type TabItemProps = { label: string; icon: IconName; activeIcon: IconName; focused: boolean; onPress: () => void };

// Aba com transição: a pílula de fundo cresce, o ícone sobe levemente e o rótulo ganha destaque.
function TabItem({ label, icon, activeIcon, focused, onPress }: TabItemProps) {
  const { colors, isDark } = useTheme();
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(progress, { toValue: focused ? 1 : 0, ...spring }).start();
  }, [focused, progress]);

  const pressTo = (toValue: number) => Animated.spring(press, { toValue, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  const idle = isDark ? colors.textSecondary : colors.textTertiary;
  const active = colors.primaryText;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => pressTo(0.9)}
      onPressOut={() => pressTo(1)}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={styles.item}
    >
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: press }] }]}>
        <Animated.View
          style={[
            styles.pill,
            {
              backgroundColor: isDark ? 'rgba(140,188,245,0.16)' : colors.primarySoft,
              opacity: progress,
              transform: [{ scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
            },
          ]}
        />
        <Animated.View
          style={{
            transform: [
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) },
              { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
            ],
          }}
        >
          <Icon name={focused ? activeIcon : icon} size={22} color={focused ? active : idle} />
        </Animated.View>
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: focused ? active : idle,
            fontFamily: focused ? fonts.bold : fonts.medium,
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
          },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: spacing.sm + 2,
    paddingHorizontal: BAR_PADDING,
  },
  indicator: {
    position: 'absolute',
    top: -1,
    left: 0,
    width: INDICATOR_WIDTH,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: { width: 60, height: 32, alignItems: 'center', justifyContent: 'center' },
  pill: { ...StyleSheet.absoluteFill, borderRadius: radii.pill },
  label: { fontSize: 11, letterSpacing: 0.1 },
});
