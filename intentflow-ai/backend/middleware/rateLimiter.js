/**
 * Rate Limiter Middleware
 * Protects against spam and abuse — runs BEFORE auth
 */

const rateLimit = require('express-rate-limit');

// General API rate limiter: 100 requests per 15 minutes per IP
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

// Stricter limiter for NLP endpoints (expensive Gemini calls)
const nlpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,                  // 10 NLP requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'NLP rate limit exceeded — please wait a moment',
  },
});

module.exports = { apiLimiter, nlpLimiter };
