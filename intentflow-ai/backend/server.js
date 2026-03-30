/**
 * IntentFlow AI — Backend Server
 * Production-hardened Express server with proper middleware stack
 */

require('dotenv').config();

// ─── Validate environment before anything else ───────────────────────────────
const validateEnv = require('./config/envValidator');
validateEnv();

const express = require('express');
const app = express();

// ─── Middleware Stack (ORDER MATTERS) ─────────────────────────────────────────
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter, nlpLimiter } = require('./middleware/rateLimiter');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// 1. Parse JSON bodies
app.use(express.json());

// 2. Log all incoming requests
app.use(requestLogger);

// 3. Rate limiting (before auth to block spam)
app.use('/api', apiLimiter);

// ─── Public Routes (no auth required) ─────────────────────────────────────────

// Health check endpoint (for Railway / monitoring)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Auth routes (OAuth flow — must be public)
const authRouter = require('./routes/auth.routes');
app.use('/auth', authRouter);

// ─── Protected Routes (auth required) ─────────────────────────────────────────

// 4. Auth middleware protects all /api routes
app.use('/api', authMiddleware);

// Task routes
const taskRoutes = require('./routes/tasks.routes');
app.use('/api/tasks', taskRoutes);

// HITL routes (with stricter rate limiting for NLP-heavy endpoints)
const hitlRoutes = require('./routes/hitl.routes');
app.use('/api/hitl', hitlRoutes);

// NLP extraction endpoint (with NLP rate limiter)
const taskService = require('./services/taskService');
app.post('/api/nlp/extract', nlpLimiter, async (req, res, next) => {
  try {
    const result = await taskService.processNLPInput(req.body.input);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Error Handler (MUST be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log(`🚀 IntentFlow AI Backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('═══════════════════════════════════════════');
});