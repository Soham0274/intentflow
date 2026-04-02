const { ApiError } = require('../utils/ApiError');
const { ZodError } = require('zod');
const { error } = require('../utils/responseHelper');
const logger = require('../utils/logger');
const config = require('../config');

function errorHandler(err, req, res, _next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err instanceof ApiError) {
    logger.warn({
      message: 'API Error',
      requestId: req.requestId,
      statusCode: err.statusCode,
      error: err.message,
      details: err.details,
      path: req.originalUrl,
      method: req.method
    });
    
    return error(res, err.message, err.statusCode, err.details);
  }

  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({ 
      path: e.path.join('.'), 
      message: e.message 
    }));
    
    logger.warn({
      message: 'Validation Error',
      requestId: req.requestId,
      errors: details,
      path: req.originalUrl,
      method: req.method
    });
    
    return error(res, 'Validation Error', 400, details);
  }

  logger.error({
    message: 'Unhandled Error',
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  const isDev = config.NODE_ENV === 'development';
  
  return error(
    res, 
    isDev ? err.message : 'Internal Server Error', 
    500, 
    isDev ? { stack: err.stack } : null
  );
}

module.exports = errorHandler;