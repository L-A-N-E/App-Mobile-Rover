import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Feedback tátil seguro: ignora no web e em aparelhos sem suporte.
export function tap(style: 'light' | 'medium' = 'light') {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(style === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function success() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
