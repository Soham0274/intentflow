const { ApiError } = require('../utils/ApiError');
const { ZodError } = require('zod');
const { error } = require('../utils/responseHelper');
const config = require('../config/index');

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return error(res, err.message, err.statusCode, err.details);
  }

  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({ path: e.path.join('.'), message: e.message }));
    return error(res, 'Validation Error', 400, details);
  }

  console.error('[Error Handler]', err);

  const isDev = config.NODE_ENV === 'development';
  return error(res, 'Internal Server Error', 500, isDev ? err.message : null);
}

module.exports = errorHandler;