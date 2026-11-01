const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });
const express = require('express');
const cors = require('cors');


const setupRoutes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const sendResponse = require('./utils/sendResponse');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  return sendResponse(res, 200, 'VTicket Backend API is healthy');
});

// Setup All API Routes (/api/v1 with Rate Limiting)
setupRoutes(app);

// 404 Handler
app.use((req, res) => {
  return sendResponse(res, 404, `Đường dẫn ${req.originalUrl} không tồn tại`);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
