import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { Icon, IconName } from '../components/Icon';
import { radii, shadows, spacing } from '../tokens';
import { useTheme } from './ThemeContext';

type ToastOptions = {
  message: string;
  icon?: IconName;
  tone?: 'default' | 'success' | 'danger';
  action?: { label: string; onPress: () => void }; // ex.: "Desfazer"
};

const ToastContext = createContext<((options: ToastOptions) => void) | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(
    (duration = 200) => {
      if (timer.current) clearTimeout(timer.current);
      Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }).start(() => setToast(null));
    },
    [anim],
  );

  const show = useCallback(
    (options: ToastOptions) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(options);
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
      // com ação, dá mais tempo para o usuário reagir
      timer.current = setTimeout(() => hide(), options.action ? 5000 : 2200);
    },
    [anim, hide],
  );

  const iconColor = toast?.tone === 'danger' ? colors.danger : toast?.tone === 'success' ? colors.success : colors.accent;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <View pointerEvents={toast.action ? 'box-none' : 'none'} style={[styles.wrapper, { top: insets.top + spacing.sm }]}>
          <Animated.View
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              shadows.lg,
              {
                backgroundColor: isDark ? colors.surfaceAlt : '#12263A',
                shadowColor: colors.shadow,
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
              },
            ]}
          >
            <Icon name={toast.icon ?? 'check-circle'} size={20} color={iconColor} />
            <AppText variant="label" color="#FFFFFF" style={styles.text}>
              {toast.message}
            </AppText>
            {toast.action ? (
              <Pressable
                hitSlop={12}
                accessibilityRole="button"
                onPress={() => {
                  toast.action?.onPress();
                  hide(150);
                }}
                style={styles.action}
              >
                <AppText variant="label" color={colors.accent}>
                  {toast.action.label}
                </AppText>
              </Pressable>
            ) : null}
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return context;
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: spacing.screen, right: spacing.screen, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: 420,
  },
  text: { flexShrink: 1 },
  action: { marginLeft: spacing.sm, paddingLeft: spacing.md, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' },
});
