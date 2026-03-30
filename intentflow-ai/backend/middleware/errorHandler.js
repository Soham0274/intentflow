/**
 * Centralized Error Handler Middleware
 * Must be the LAST middleware in the Express stack
 */

const { ZodError } = require('zod');
const { ApiError, NLPValidationError } = require('../errors/ApiError');

function errorHandler(err, req, res, next) {
  // Log all errors for debugging
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  };
  console.error('[ERROR]', JSON.stringify(logEntry));

  // Known operational errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err instanceof NLPValidationError && { hitl_required: true }),
    });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // JSON parse errors (malformed request body)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
    });
  }

  // Supabase errors (common pattern)
  if (err.code && err.message && err.details) {
    return res.status(500).json({
      success: false,
      error: 'Database operation failed',
      ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
    });
  }

  // Unknown/unhandled errors — never expose internals in production
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
