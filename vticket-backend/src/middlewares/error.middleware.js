const sendResponse = require('../utils/sendResponse');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ';

  if (process.env.NODE_ENV === 'development') {
    console.error('[Global Error]', err);
  }

  return sendResponse(res, statusCode, message, null);
};

module.exports = errorHandler;
