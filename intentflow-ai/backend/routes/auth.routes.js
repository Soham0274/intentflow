const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Initiate Google OAuth
router.get('/google', async (req, res) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.FRONTEND_URL}/auth/callback`
    }
  });

  if (error) return res.status(500).json({ error: error.message });
  res.redirect(data.url);
});

// Handle callback — exchange code for session
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) return res.status(400).json({ error: 'No code provided' });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return res.status(500).json({ error: error.message });

  // Save user to your users table if first time
  const user = data.user;
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('oauth_id', user.id)
    .single();

  if (!existingUser) {
    await supabase.from('users').insert({
      oauth_id:    user.id,
      email:       user.email,
      name:        user.user_metadata?.full_name || '',
      avatar_url:  user.user_metadata?.avatar_url || '',
    });
  }

  // Redirect to app with session token
  res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${data.session.access_token}`);
});

module.exports = router;
