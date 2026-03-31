const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const userRepo = require('../../repositories/user.repository');
const authMiddleware = require('../../middleware/auth.middleware');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
  process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
);

// GET /api/auth/google/url
// Mobile app requests the auth url, injecting the token
router.get('/url', authMiddleware, (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
  });
  res.json({ success: true, url });
});

// POST /api/auth/google/callback
// Post the auth code returned from Google browser auth
router.post('/callback', authMiddleware, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Missing code' });
    }
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (tokens.refresh_token) {
      const userId = req.user.id;
      let currentPrefs = {};
      try {
        currentPrefs = await userRepo.getPreferences(userId);
      } catch (err) {} 
      
      const newPrefs = {
        ...(currentPrefs || {}),
        google_refresh_token: tokens.refresh_token,
        google_calendar_connected: true
      };
      
      await userRepo.upsertPreferences(userId, newPrefs);
    }
    
    res.json({ success: true, message: 'Google Calendar synchronized' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
