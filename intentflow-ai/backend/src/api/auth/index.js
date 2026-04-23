const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabaseClient');
const { success } = require('../../utils/responseHelper');
const asyncHandler = require('../../utils/asyncHandler');
const config = require('../../config/index');
const requireAuth = require('../../middleware/auth.middleware');

router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, full_name } = req.body;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } }
  });
  if (error) throw error;
  
  // Custom users table inserted via triggers or via app
  success(res, data);
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  success(res, data);
}));

router.post('/logout', requireAuth, asyncHandler(async (req, res) => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  success(res, { message: 'Logged out successfully' });
}));

// OAuth
router.get('/google', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
       redirectTo: `${config.APP.FRONTEND_URL}/auth/callback`,
       scopes: 'https://www.googleapis.com/auth/calendar.events',
       queryParams: {
        access_type: 'offline',
        prompt: 'consent'
       }
    }
  });
  if (error) throw error;
  res.redirect(data.url);
}));

router.get('/callback', asyncHandler(async (req, res) => {
  const { code, redirect_to } = req.query;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  // Use the ANON client locally for this request so we don't pollute the global SERVICE client
  const { createClient } = require('@supabase/supabase-js');
  const tempClient = createClient(config.SUPABASE.URL, config.SUPABASE.ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await tempClient.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[Auth Callback] Error:', error.message);
    return res.redirect(`${config.APP.FRONTEND_URL}/login?error=auth_failed`);
  }

  // Ensure user is synced
  const user = data.user;
  if (user) {
    await supabase.from('users').upsert({
      id: user.id, // Enforce correct ID
      oauth_id: user.id, // For backward compatibility if needed
      email: user.email,
      name: user.user_metadata?.full_name || '',
      avatar_url: user.user_metadata?.avatar_url || ''
    }, { onConflict: 'id' }).catch(err => console.error('[Auth Callback] Sync Error:', err));
  }

  // Use the client-provided redirect_to or default to web frontend
  const baseUrl = redirect_to || `${config.APP.FRONTEND_URL}/dashboard`;
  res.redirect(`${baseUrl}?token=${data.session.access_token}`);
}));

// Google Calendar Sync Flow (from previous session)
const googleSyncRouter = require('./google');
router.use('/google-sync', googleSyncRouter);

module.exports = router;