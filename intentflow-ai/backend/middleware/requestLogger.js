/**
 * Request Logger Middleware
 * Logs method, URL, status code, and response time for every request
 */

function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';

    console.log(
      `[${level}] ${method} ${originalUrl} → ${status} (${duration}ms)`
    );
  });

  next();
}

module.exports = requestLogger;
