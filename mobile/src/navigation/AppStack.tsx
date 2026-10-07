import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PremiumScreen } from '../screens/PremiumScreen';
import { TripDetailScreen } from '../screens/TripDetailScreen';
import { AppTabs } from './AppTabs';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}
