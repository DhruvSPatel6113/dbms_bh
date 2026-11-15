const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Primary API Router mounting
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;

