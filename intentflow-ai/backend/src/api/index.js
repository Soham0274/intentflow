/**
 * Api Index — Exposes all sub-routers
 */

const express = require('express');
const router = express.Router();

const nlpRoutes = require('./nlp/index');
const tasksRoutes = require('./tasks/index');
const hitlRoutes = require('./hitl/index');
const automationRoutes = require('./automation/index');
const authRoutes = require('./auth/index');
const usersRoutes = require('./users/index');
const calendarRoutes = require('./calendar/index');
const healthRoutes = require('./health/index');

router.use('/nlp', nlpRoutes);
router.use('/tasks', tasksRoutes);
router.use('/hitl', hitlRoutes);
router.use('/automation', automationRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/calendar', calendarRoutes);
router.use('/health', healthRoutes);

module.exports = router;