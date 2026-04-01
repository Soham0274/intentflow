import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';

/**
 * Initiates Google OAuth sign-in using Expo WebBrowser
 * This properly handles the OAuth flow and returns the session
 */
export async function signInWithGoogle() {
  try {
    // Create the return URL using expo-linking
    const redirectTo = Linking.createURL('auth/callback');
    console.log('[GoogleAuth] Using redirect URL:', redirectTo);

    // Get OAuth URL from Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true, // We'll handle the browser ourselves
      },
    });

    if (error) {
      console.error('[GoogleAuth] Failed to get OAuth URL:', error);
      return { error, session: null };
    }

    if (!data?.url) {
      return { error: new Error('No OAuth URL returned'), session: null };
    }

    console.log('[GoogleAuth] Opening WebBrowser with URL:', data.url);

    // Open the browser for OAuth
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    console.log('[GoogleAuth] WebBrowser result:', result.type);

    if (result.type === 'success') {
      // Supabase v2.x automatically extracts tokens from URL when session is retrieved
      // The auth state change listener will pick up the new session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[GoogleAuth] Failed to get session:', sessionError);
        return { error: sessionError, session: null };
      }

      if (sessionData.session) {
        console.log('[GoogleAuth] Successfully signed in:', sessionData.session.user?.email);
        return { error: null, session: sessionData.session };
      }

      return { error: new Error('No session found after OAuth'), session: null };
    }

    if (result.type === 'cancel') {
      return { error: new Error('User cancelled the sign-in'), session: null };
    }

    if (result.type === 'dismiss') {
      return { error: new Error('Sign-in was dismissed'), session: null };
    }

    return { error: new Error(`Unexpected result type: ${result.type}`), session: null };
  } catch (err) {
    console.error('[GoogleAuth] Unexpected error:', err);
    return { 
      error: err instanceof Error ? err : new Error('Google sign-in failed'), 
      session: null 
    };
  }
}
