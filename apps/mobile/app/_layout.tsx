import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="guidance" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
