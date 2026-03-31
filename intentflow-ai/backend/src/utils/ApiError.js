class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NLPValidationError extends ApiError {
  constructor(message, details = null) {
    super(422, message, details);
  }
}

class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`);
  }
}

module.exports = {
  ApiError,
  NLPValidationError,
  NotFoundError
};