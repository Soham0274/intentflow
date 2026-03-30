/**
 * HITL Routes — IntentFlow AI
 * Human-in-the-loop review flow — thin handlers delegating to taskService
 */

const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');
const { nlpLimiter } = require('../middleware/rateLimiter');

// POST /api/hitl/submit — Submit text for NLP extraction + HITL queue
router.post('/submit', nlpLimiter, async (req, res, next) => {
  try {
    const { input_text } = req.body;
    const result = await taskService.submitToHITL(req.user.id, input_text);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/hitl/approve — Approve HITL item → create task
router.post('/approve', async (req, res, next) => {
  try {
    const { queue_id, final_data } = req.body;

    if (!queue_id || !final_data) {
      return res.status(400).json({
        success: false,
        error: 'queue_id and final_data required',
      });
    }

    const result = await taskService.approveHITL(queue_id, req.user.id, final_data);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/hitl/reject — Reject HITL item
router.post('/reject', async (req, res, next) => {
  try {
    const { queue_id, reason } = req.body;

    if (!queue_id) {
      return res.status(400).json({
        success: false,
        error: 'queue_id required',
      });
    }

    const result = await taskService.rejectHITL(queue_id, reason);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/hitl/pending — Get all pending items for authenticated user
router.get('/pending', async (req, res, next) => {
  try {
    const pending = await taskService.getPendingHITL(req.user.id);
    res.json({ success: true, pending, count: pending.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/hitl/stats — NLP accuracy stats for authenticated user
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await taskService.getHITLStats(req.user.id);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
