import { createNavigationContainerRef, DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { WeatherWatcher } from '../components/WeatherWatcher';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { onNotificationOpen } from '../services/notifications';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';
import { AppStackParamList } from './types';

const navigationRef = createNavigationContainerRef<AppStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const [navReady, setNavReady] = useState(false);
  const [pendingTripId, setPendingTripId] = useState<string | null>(null);

  // Toque em notificação de clima: abre a viagem assim que a navegação e o login estiverem prontos.
  useEffect(() => onNotificationOpen(setPendingTripId), []);
  useEffect(() => {
    if (pendingTripId && user && navReady && navigationRef.isReady()) {
      navigationRef.navigate('TripDetail', { tripId: pendingTripId });
      setPendingTripId(null);
    }
  }, [pendingTripId, user, navReady]);

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primaryText} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} onReady={() => setNavReady(true)}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* botões da barra do sistema (Android) claros no tema escuro e vice-versa */}
      <NavigationBar style={isDark ? 'light' : 'dark'} />
      {user ? (
        <>
          <AppStack />
          <WeatherWatcher onOpenTrip={setPendingTripId} />
        </>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
