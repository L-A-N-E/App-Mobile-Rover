import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { ColorTokens, darkColors, lightColors } from '../tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  colors: ColorTokens;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = '@rover:theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';

    const setPreference = (next: ThemePreference) => {
      setPreferenceState(next);
      AsyncStorage.setItem(STORAGE_KEY, next);
    };

    return {
      colors: isDark ? darkColors : lightColors,
      isDark,
      preference,
      setPreference,
      toggleTheme: () => setPreference(isDark ? 'light' : 'dark'),
    };
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}
