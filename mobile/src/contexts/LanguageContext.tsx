import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { deviceLanguage, Language, LANGUAGES, setCurrentLanguage, t, tn } from '../i18n';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: typeof t;
  tn: typeof tn;
};

const STORAGE_KEY = '@rover:language';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const initial = LANGUAGES.includes(stored as Language) ? (stored as Language) : deviceLanguage();
      setCurrentLanguage(initial);
      setLanguageState(initial);
    });
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setCurrentLanguage(next); // antes do re-render, para as funções fora de componentes
    setLanguageState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  // t/tn ganham nova identidade a cada troca: componentes que dependem deles em memos re-calculam.
  const value = useMemo<LanguageContextValue | null>(
    () => (language ? { language, setLanguage, t: (...args) => t(...args), tn: (...args) => tn(...args) } : null),
    [language, setLanguage],
  );

  // Espera o idioma salvo para não abrir em um idioma e trocar logo depois.
  if (!value) return null;
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useI18n deve ser usado dentro de LanguageProvider');
  return context;
}
