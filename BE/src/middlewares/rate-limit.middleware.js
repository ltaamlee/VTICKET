const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter Middleware for API protection against spam & DDoS
 */
const apiLimiter = rateLimit({
  windowMs: 10000 * 60 * 1000, // 1 hour
  max: 10000, // Limit each IP to 100 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 60 phút.',
    data: null,
  },
});

module.exports = { apiLimiter };
