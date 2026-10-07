import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { TripsProvider } from './src/contexts/TripsContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { fontAssets } from './src/tokens';

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  // Se a fonte falhar, segue com a fonte do sistema em vez de travar numa tela em branco.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <TripsProvider>
                <RootNavigator />
              </TripsProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
