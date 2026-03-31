/**
 * Auth Service — IntentFlow AI
 * Token verification, session helpers via Supabase Auth
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

const supabaseAuth = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

async function verifyToken(token) {
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.email,
  };
}

async function refreshSession(refreshToken) {
  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: refreshToken,
  });
  
  if (error) {
    throw error;
  }
  
  return {
    accessToken: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
    expiresAt: data.session?.expires_at,
  };
}

async function signOut(token) {
  const { error } = await supabaseAuth.auth.signOut(token);
  if (error) throw error;
  return { message: 'Logged out successfully' };
}

module.exports = {
  verifyToken,
  refreshSession,
  signOut,
};