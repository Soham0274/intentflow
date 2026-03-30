/**
 * Custom API Error classes for IntentFlow AI
 * Centralized error types for structured error handling
 */

class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

class NLPValidationError extends ApiError {
  constructor(message, context = {}) {
    super(422, message, true);
    this.name = 'NLPValidationError';
    this.context = context;
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, message, true);
    this.name = 'AuthenticationError';
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Access denied') {
    super(403, message, true);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`, true);
    this.name = 'NotFoundError';
  }
}

class RateLimitError extends ApiError {
  constructor(message = 'Too many requests — please slow down') {
    super(429, message, true);
    this.name = 'RateLimitError';
  }
}

module.exports = {
  ApiError,
  NLPValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
};
