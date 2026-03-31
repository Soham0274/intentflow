/**
 * Rate Limit Middleware — IntentFlow AI
 * Per-IP rate limiting (express-rate-limit)
 */

const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests — please try again later',
  },
});

const nlpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'NLP rate limit exceeded — please wait a moment',
  },
});

module.exports = { apiLimiter, nlpLimiter };