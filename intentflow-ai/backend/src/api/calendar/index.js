const express = require('express');
const router = express.Router();
const calendarService = require('../../services/calendar.service');
const { success } = require('../../utils/responseHelper');
const asyncHandler = require('../../utils/asyncHandler');
const requireAuth = require('../../middleware/auth.middleware');

/**
 * GET /api/calendar/events
 * Fetch upcoming events from Google Calendar.
 */
router.get('/events', requireAuth, asyncHandler(async (req, res) => {
  const events = await calendarService.listUpcomingEvents(req.user.id);
  success(res, events);
}));

/**
 * POST /api/calendar/sync-task
 * Manually sync an existing task to Google Calendar.
 */
router.post('/sync-task', requireAuth, asyncHandler(async (req, res) => {
  const { task } = req.body;
  if (!task || !task.title) {
    return res.status(400).json({ success: false, message: 'Invalid task data' });
  }
  
  const result = await calendarService.createEvent(req.user.id, task);
  success(res, result);
}));

module.exports = router;
