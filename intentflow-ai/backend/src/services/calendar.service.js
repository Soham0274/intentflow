/**
 * Google Calendar Service — IntentFlow AI
 * Integration with Google Calendar API using tokens stored in user preferences.
 */

const { google } = require('googleapis');
const userRepo = require('../repositories/user.repository');
const config = require('../config');

/**
 * Authenticates with Google API using the user's refresh token.
 */
async function getAuthenticatedClient(userId) {
  const prefs = await userRepo.getPreferences(userId);
  if (!prefs?.google_refresh_token) {
    throw new Error('Google Calendar not connected');
  }

  // Use config values
  const oauth2Client = new google.auth.OAuth2(
    config.GOOGLE.CLIENT_ID,
    config.GOOGLE.CLIENT_SECRET,
    config.GOOGLE.REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: prefs.google_refresh_token
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Lists the next 10 upcoming events from the primary calendar.
 */
async function listUpcomingEvents(userId, maxResults = 10) {
  try {
    const calendar = await getAuthenticatedClient(userId);
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return res.data.items || [];
  } catch (err) {
    console.error('Calendar List Error:', err.message);
    return []; // Return empty array on failure instead of crashing the whole dashboard
  }
}

/**
 * Creates a new event in the Google Calendar based on an IntentFlow task.
 */
async function createEvent(userId, task) {
  const calendar = await getAuthenticatedClient(userId);
  
  // Predict start time from due_date/due_time
  let startDateTime;
  if (task.due_date && task.due_time) {
     startDateTime = new Date(`${task.due_date}T${task.due_time}`).toISOString();
  } else if (task.due_date) {
     const day = task.due_date.split('T')[0];
     startDateTime = new Date(`${day}T09:00:00Z`).toISOString();
  } else {
     startDateTime = new Date().toISOString();
  }
  
  const duration = 45 * 60 * 1000;
  const endDateTime = new Date(new Date(startDateTime).getTime() + duration).toISOString();

  const event = {
    summary: task.title,
    description: task.description || 'IntentFlow Task Sync',
    colorId: '2', // Sage/Green color
    start: { dateTime: startDateTime },
    end: { dateTime: endDateTime },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 10 }
      ],
    },
  };

  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });
  
  return res.data;
}

module.exports = {
  listUpcomingEvents,
  getAuthenticatedClient,
  createEvent
};
