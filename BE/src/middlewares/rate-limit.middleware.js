const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter Middleware for API protection against spam & DDoS
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút.',
    data: null,
  },
});

module.exports = { apiLimiter };
