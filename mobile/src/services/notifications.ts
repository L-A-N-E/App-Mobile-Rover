import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import { t } from '../i18n';
import { formatShortDate } from '../utils/dates';
import { reasonLabel, StopImpact } from '../utils/weatherImpact';

// Alertas de clima: notificação local do sistema quando possível, alerta dentro do app quando não.

const ENABLED_KEY = '@rover:notifications';
const SENT_KEY = '@rover:weather-alerts';
const CHANNEL_ID = 'clima';

// Desde o SDK 53, o expo-notifications lança erro já ao ser importado no Expo Go do Android
// (o recurso de push foi removido de lá). Por isso o módulo só é carregado onde funciona:
// iOS e builds próprios do app (development build / APK). No web também não há suporte.
export const notificationsSupported = Platform.OS !== 'web' && !(Platform.OS === 'android' && isRunningInExpoGo());

const Notifications: typeof NotificationsModule | null = notificationsSupported
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('expo-notifications') as typeof NotificationsModule)
  : null;

// Mostra o alerta mesmo com o app aberto.
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function getNotificationsEnabled() {
  return (await AsyncStorage.getItem(ENABLED_KEY)) !== 'off';
}

export async function setNotificationsEnabled(enabled: boolean) {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'on' : 'off');
}

// Pede permissão só quando precisa. Retorna se é possível enviar notificação do sistema.
export async function ensurePermission(): Promise<boolean> {
  if (!Notifications) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: t('notif.channelName'),
      description: t('notif.channelDescription'),
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

const weatherEmoji: Record<StopImpact['reason'], string> = {
  storm: '⛈️',
  rain: '🌧️',
  snow: '❄️',
  heat: '🌡️',
  cold: '🥶',
  wind: '💨',
};

export type WeatherAlertMessage = { tripId: string; title: string; body: string };

// Um alerta por dia afetado, sem repetir o mesmo alerta (mesmas atividades e motivos).
// Envia como notificação do sistema; se não for possível, devolve os alertas para o app exibir.
export async function notifyWeatherImpacts(
  tripId: string,
  cityName: string,
  impacts: StopImpact[],
): Promise<WeatherAlertMessage[]> {
  if (!impacts.length || !(await getNotificationsEnabled())) return [];

  const sent = JSON.parse((await AsyncStorage.getItem(SENT_KEY)) ?? '{}') as Record<string, number>;
  const byDate = new Map<string, StopImpact[]>();
  impacts.forEach((imp) => byDate.set(imp.date, [...(byDate.get(imp.date) ?? []), imp]));

  const inApp: WeatherAlertMessage[] = [];
  for (const [date, list] of byDate) {
    const key = `${tripId}|${date}|${list.map((i) => `${i.placeId}:${i.reason}`).sort().join(',')}`;
    if (sent[key]) continue;

    const main = list.find((i) => i.severity === 'alerta') ?? list[0];
    const places = list.map((i) => `${i.placeName} (${i.detail.charAt(0).toLowerCase()}${i.detail.slice(1)})`);
    const shown = places.slice(0, 2).join(t('common.and')) + (places.length > 2 ? t('notif.andMore', { count: places.length - 2 }) : '');
    const message: WeatherAlertMessage = {
      tripId,
      title: t('notif.title', { emoji: weatherEmoji[main.reason], reason: reasonLabel(main.reason), city: cityName, date: formatShortDate(date) }),
      body: t('notif.body', { places: shown }),
    };

    if (Notifications && (await ensurePermission())) {
      await Notifications.scheduleNotificationAsync({
        content: { title: message.title, body: `${message.body} ${t('notif.tapHint')}`, data: { tripId } },
        // imediato (no Android, no canal de alertas de clima)
        trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
      });
    } else {
      inApp.push(message);
    }
    sent[key] = Date.now();
  }
  await AsyncStorage.setItem(SENT_KEY, JSON.stringify(sent));
  return inApp;
}

// Abre a viagem quando o usuário toca na notificação (inclusive com o app fechado).
export function onNotificationOpen(handler: (tripId: string) => void) {
  if (!Notifications) return () => {};
  const handle = (response: NotificationsModule.NotificationResponse | null) => {
    const tripId = response?.notification.request.content.data?.tripId;
    if (typeof tripId === 'string') handler(tripId);
  };
  Notifications.getLastNotificationResponseAsync().then(handle);
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
