const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
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

const createKeyGenerator = (req) => {
    if (req.user?.id) {
        return `user:${req.user.id}`;
    }

    return `ip:${ipKeyGenerator(req.ip)}`;
};

/**
 * Rate Limiter Middleware for API protection against spam & DDoS
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    ...(createRedisStore('rl:api:')
        ? { store: createRedisStore('rl:api:') }
        : {}),
    message: {
        success: false,
        statusCode: 429,
        message: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 60 phút.',
        data: null,
    },

});

const bookingSessionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: createKeyGenerator,
    ...(createRedisStore('rl:booking-session:')
        ? { store: createRedisStore('rl:booking-session:') }
        : {}),
    message: {
        success: false,
        statusCode: 429,
        message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
        data: null,
    },
});

const createOrderLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: createKeyGenerator,
    ...(createRedisStore('rl:create-order:')
        ? { store: createRedisStore('rl:create-order:') }
        : {}),
    message: {
        success: false,
        statusCode: 429,
        message: 'Bạn đang tạo đơn quá nhanh. Vui lòng chờ một chút rồi thử lại.',
        data: null,
    },
});

module.exports = { apiLimiter, bookingSessionLimiter, createOrderLimiter };