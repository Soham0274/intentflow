const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const requestLogger = (req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  
  const start = Date.now();
  
  logger.http({
    message: 'Incoming request',
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(level, {
      message: 'Request completed',
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration
    });
  });
  
  next();
};

module.exports = requestLogger;