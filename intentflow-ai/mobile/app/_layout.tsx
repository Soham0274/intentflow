import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider, useAuth } from '../store/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AppProvider } from '../context/AppContext';
import { useAuthCallback } from '../hooks/useAuthCallback';

const queryClient = new QueryClient();

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // Handle OAuth deep link callbacks
  useAuthCallback();

  useEffect(() => {
    if (isLoading) return;
    if (!navigationState?.key) return; // Wait until navigation is fully mounted

    const inProtectedGroup = segments[0] === '(tabs)';

    if (!session && inProtectedGroup) {
      // User is not authenticated but trying to access protected UI
      router.replace('/login');
    } else if (session && (segments[0] === 'login' || segments[0] === 'onboarding')) {
      // User is authenticated but on an auth screen
      router.replace('/(tabs)' as any);
    }
  }, [session, isLoading, segments, navigationState?.key]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="task/[id]" />
      
      {/* Modals & Stack Screens */}
      <Stack.Screen name="voice" />
      <Stack.Screen name="alerts" />
      <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="error" options={{ presentation: 'modal' }} />
      <Stack.Screen name="review" options={{ presentation: 'modal' }} />
      <Stack.Screen name="confirm" options={{ presentation: 'modal' }} />
      <Stack.Screen name="ambiguity" options={{ presentation: 'modal' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'login',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ThemeProvider>
                <AuthProvider>
                  <AppProvider>
                    <RootNavigator />
                  </AppProvider>
                </AuthProvider>
              </ThemeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}