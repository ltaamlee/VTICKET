const { getRedisClient } = require("../../config/redis");

const MAX_ACTIVE_BOOKERS = Math.max(1, Number(process.env.WAITING_ROOM_LIMIT || 100));
const ACTIVE_TTL_MS = 15 * 60 * 1000;

const ENTER_LUA = `
local activeKey = KEYS[1]
local queueKey = KEYS[2]
local seqKey = KEYS[3]
local userId = ARGV[1]
local now = tonumber(ARGV[2])
local expiresAt = tonumber(ARGV[3])
local limit = tonumber(ARGV[4])

redis.call("ZREMRANGEBYSCORE", activeKey, "-inf", now)

if redis.call("ZSCORE", activeKey, userId) then
    return {"ADMITTED", 0, 0}
end

local activeCount = redis.call("ZCARD", activeKey)
if activeCount < limit then
    redis.call("ZADD", activeKey, expiresAt, userId)
    redis.call("ZREM", queueKey, userId)
    return {"ADMITTED", 0, 0}
end

local seq = redis.call("INCR", seqKey)
redis.call("ZADD", queueKey, "NX", seq, userId)
local rank = redis.call("ZRANK", queueKey, userId) or 0
local total = redis.call("ZCARD", queueKey) or 0
return {"QUEUED", rank + 1, total}
`;

const RELEASE_LUA = `
local activeKey = KEYS[1]
local queueKey = KEYS[2]
local userId = ARGV[1]
local now = tonumber(ARGV[2])
local expiresAt = tonumber(ARGV[3])
local limit = tonumber(ARGV[4])

redis.call("ZREM", activeKey, userId)
redis.call("ZREM", queueKey, userId)
redis.call("ZREMRANGEBYSCORE", activeKey, "-inf", now)

local activeCount = redis.call("ZCARD", activeKey)
if activeCount < limit then
    local popped = redis.call("ZPOPMIN", queueKey, 1)
    if popped and #popped >= 1 then
        redis.call("ZADD", activeKey, expiresAt, popped[1])
        return popped[1]
    end
end
return ""
`;

function keysFor(eventId) {
    return [
        `waiting:active:${eventId}`,
        `waiting:queue:${eventId}`,
        `waiting:seq:${eventId}`,
    ];
}

async function enterWaitingRoom(eventId, userId) {
    const redis = getRedisClient();
    if (!redis) return { status: "ADMITTED", position: 0, total: 0 };

    const now = Date.now();
    const expiresAt = now + ACTIVE_TTL_MS;
    try {
        const [activeKey, queueKey, seqKey] = keysFor(eventId);
        const result = await redis.eval(
            ENTER_LUA,
            3,
            activeKey,
            queueKey,
            seqKey,
            String(userId),
            String(now),
            String(expiresAt),
            String(MAX_ACTIVE_BOOKERS)
        );
        return {
            status: result?.[0] || "ADMITTED",
            position: Number(result?.[1] || 0),
            total: Number(result?.[2] || 0),
        };
    } catch {
        return { status: "ADMITTED", position: 0, total: 0 };
    }
}

async function releaseWaitingRoomSlot(eventId, userId) {
    const redis = getRedisClient();
    if (!redis || !eventId || !userId) return null;

    const now = Date.now();
    const expiresAt = now + ACTIVE_TTL_MS;
    try {
        const [activeKey, queueKey] = keysFor(eventId);
        return await redis.eval(
            RELEASE_LUA,
            2,
            activeKey,
            queueKey,
            String(userId),
            String(now),
            String(expiresAt),
            String(MAX_ACTIVE_BOOKERS)
        );
    } catch {
        return null;
    }
}

module.exports = {
    enterWaitingRoom,
    releaseWaitingRoomSlot,
    MAX_ACTIVE_BOOKERS,
};

