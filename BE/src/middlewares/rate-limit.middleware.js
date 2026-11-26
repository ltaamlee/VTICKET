const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');

const redisClient = getRedisClient();
const createRedisStore = (prefix) =>
  redisClient
    ? new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix,
      })
    : undefined;

const store = createRedisStore('rl:api:');

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

const bookingSessionStore = createRedisStore('rl:booking-session:');
const bookingSessionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  ...(bookingSessionStore ? { store: bookingSessionStore } : {}),
  message: {
    success: false,
    statusCode: 429,
    message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
    data: null,
  },
});

const createOrderStore = createRedisStore('rl:create-order:');
const createOrderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  ...(createOrderStore ? { store: createOrderStore } : {}),
  message: {
    success: false,
    statusCode: 429,
    message: 'Bạn đang tạo đơn quá nhanh. Vui lòng chờ một chút rồi thử lại.',
    data: null,
  },
});

module.exports = { apiLimiter, bookingSessionLimiter, createOrderLimiter };
