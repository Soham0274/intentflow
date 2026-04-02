import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabase';
import { useColors } from '@/hooks/useColors';

/**
 * OAuth Callback Handler
 * This screen handles the redirect back from Google OAuth
 * Supabase automatically exchanges the auth code for a session
 */
export default function AuthCallback() {
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current URL
        const url = await Linking.getInitialURL();
        console.log('[AuthCallback] Handling callback URL:', url);

        // The session is automatically handled by Supabase
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthCallback] Session error:', error);
          router.replace('/login');
          return;
        }

        if (session) {
          console.log('[AuthCallback] Session established, redirecting to app');
          // Navigate to the main app
          router.replace('/(tabs)');
        } else {
          console.log('[AuthCallback] No session found, redirecting to login');
          router.replace('/login');
        }
      } catch (err) {
        console.error('[AuthCallback] Error handling callback:', err);
        router.replace('/login');
      }
    };

    handleCallback();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
