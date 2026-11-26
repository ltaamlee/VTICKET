const Redis = require("ioredis");

let redisClient = null;

function getRedisClient() {
    if (redisClient) return redisClient;
    if (!process.env.REDIS_URL) return null;
    try {
        redisClient = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
        });
        redisClient.on("error", () => {});
        return redisClient;
    } catch {
        return null;
    }
}

module.exports = { getRedisClient };
