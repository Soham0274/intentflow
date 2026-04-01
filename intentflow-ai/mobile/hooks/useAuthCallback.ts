import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';

/**
 * Hook to handle OAuth deep link callbacks
 * Place this in your root layout to handle auth callbacks when the app
 * is already running or when it's opened via deep link
 * 
 * Note: Supabase v2.x automatically handles session extraction from OAuth callbacks
 * via the onAuthStateChange listener. We just need to ensure the URL is processed.
 */
export function useAuthCallback() {
  useEffect(() => {
    let mounted = true;

    // Handle deep links when app is foregrounded (already running)
    const subscription = Linking.addEventListener('url', async (event) => {
      console.log('[AuthCallback] Deep link received:', event.url);
      
      // Check if this is an auth callback with tokens
      if (event.url.includes('access_token') || event.url.includes('refresh_token')) {
        console.log('[AuthCallback] Auth tokens detected in URL');
        
        try {
          // Supabase v2.x automatically extracts tokens from URL when session is retrieved
          // The onAuthStateChange listener in AuthContext will handle the session update
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[AuthCallback] Failed to get session:', error);
          } else if (data.session && mounted) {
            console.log('[AuthCallback] Session established for:', data.session.user?.email);
          }
        } catch (err) {
          console.error('[AuthCallback] Error processing callback:', err);
        }
      }
    });

    // Check if app was opened via deep link (cold start)
    Linking.getInitialURL().then(async (url) => {
      if (url && (url.includes('access_token') || url.includes('refresh_token'))) {
        console.log('[AuthCallback] App opened via auth deep link');
        try {
          // Trigger session refresh to pick up tokens from URL
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[AuthCallback] Failed to get session from initial URL:', error);
          } else if (data.session) {
            console.log('[AuthCallback] Session established from initial URL');
          }
        } catch (err) {
          console.error('[AuthCallback] Error processing initial URL:', err);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
}
