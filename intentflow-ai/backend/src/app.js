/**
 * IntentFlow AI — Express Application Setup
 */

const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger.middleware');

const app = express();

app.use(cors()); // Allow all origins for dev
app.use(express.json());
app.use(requestLogger);

// Main routers
const apiRouter = require('./api/index');
app.use('/api', apiRouter);

// Global Error Handler (loads last)
const errorHandler = require('./middleware/errorHandler.middleware');
app.use(errorHandler);

module.exports = app;