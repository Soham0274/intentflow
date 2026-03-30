/**
 * Task Routes — IntentFlow AI
 * Thin route handlers delegating to taskService
 */

const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');

// GET /api/tasks — Get all tasks for authenticated user
router.get('/', async (req, res, next) => {
  try {
    const tasks = await taskService.getUserTasks(req.user.id);
    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id — Get single task
router.get('/:id', async (req, res, next) => {
  try {
    const task = await taskService.getTask(req.params.id);
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks — Create task
router.post('/', async (req, res, next) => {
  try {
    const { title, description, due_date, due_time, priority, category, confidence_score, metadata } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'title is required' });
    }

    const task = await taskService.createTaskFromData(req.user.id, {
      title,
      description,
      due_date,
      due_time,
      priority,
      category,
    }, {
      confidence: confidence_score,
      source: 'manual',
    });

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id — Update task
router.put('/:id', async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id/complete — Complete task
router.patch('/:id/complete', async (req, res, next) => {
  try {
    const task = await taskService.completeTask(req.params.id);
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id — Delete task
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
