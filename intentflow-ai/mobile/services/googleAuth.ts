import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';

// Required for OAuth session completion
WebBrowser.maybeCompleteAuthSession();

/**
 * Extracts session from URL after OAuth redirect
 */
async function handleAuthRedirect(url: string) {
  console.log('[GoogleAuth] Processing redirect URL:', url);
  
  // Check if URL contains auth tokens
  if (url.includes('access_token') || url.includes('refresh_token')) {
    // Supabase will automatically extract the session from the URL hash
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[GoogleAuth] Session extraction error:', error);
      return { error, session: null };
    }
    
    if (session) {
      console.log('[GoogleAuth] Session extracted from URL');
      return { error: null, session };
    }
  }
  
  return { error: null, session: null };
}

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
      // Process the redirect URL to extract session
      const { error: redirectError, session } = await handleAuthRedirect(result.url);
      
      if (redirectError) {
        return { error: redirectError, session: null };
      }
      
      if (session) {
        console.log('[GoogleAuth] Successfully signed in:', session.user?.email);
        return { error: null, session };
      }

      // Fallback: try to get session directly
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
