const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');

const redisClient = getRedisClient();
const store = redisClient
  ? new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    })
  : undefined;

/**
 * Rate Limiter Middleware for API protection against spam & DDoS
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10000, // Limit each IP to 10000 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  ...(store ? { store } : {}),
  message: {
    success: false,
    statusCode: 429,
    message: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 60 phút.',
    data: null,
  },
});

module.exports = { apiLimiter };
