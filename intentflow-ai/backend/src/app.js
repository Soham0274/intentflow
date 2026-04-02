/**
 * IntentFlow AI — Express Application Setup (Production-Ready)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const config = require('./config');
const requestLogger = require('./middleware/requestLogger.middleware');

const app = express();

app.use(helmet());

app.use(cors({
  origin: config.NODE_ENV === 'production' 
    ? [config.APP.FRONTEND_URL]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitize());

app.use(hpp());

app.set('trust proxy', 1);

app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const apiRouter = require('./api/index');
app.use('/api', apiRouter);

app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

const errorHandler = require('./middleware/errorHandler.middleware');
app.use(errorHandler);

module.exports = app;