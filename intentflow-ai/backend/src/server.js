/**
 * IntentFlow AI — Server Entry Point (Production-Ready)
 */

require('dotenv').config();

const app = require('./app');
const config = require('./config/index');
const logger = require('./utils/logger');

const PORT = config.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info({
    message: `Server started`,
    port: PORT,
    environment: config.NODE_ENV,
    nodeVersion: process.version
  });
});

process.on('uncaughtException', (err) => {
  logger.error({
    message: 'Uncaught Exception',
    error: err.message,
    stack: err.stack
  });
  
  process.exit(1);
});

process.on('unhandledRejection', (reason, _promise) => {
  logger.error({
    message: 'Unhandled Rejection',
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
});

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  logger.info('Shutting down gracefully...');
  
  server.close((err) => {
    if (err) {
      logger.error({ message: 'Error during shutdown', error: err.message });
      process.exit(1);
    }
    
    logger.info('Server closed successfully');
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('Force shutdown after timeout');
    process.exit(1);
  }, 10000);
}

module.exports = { server, app };