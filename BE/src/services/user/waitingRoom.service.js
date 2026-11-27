
const { getRedisClient } = require("../../config/redis");
const { AppException } = require("../../exceptions");

const configuredLimit = Number(process.env.WAITING_ROOM_LIMIT || 100);
const MAX_ACTIVE_BOOKERS =
    Number.isFinite(configuredLimit) && configuredLimit > 0
        ? Math.floor(configuredLimit)
        : 100;

const ACTIVE_TTL_MS = 15 * 60 * 1000;

const ENTER_LUA = `
local activeKey = KEYS[1]
local queueKey = KEYS[2]
local seqKey = KEYS[3]

local userId = ARGV[1]
local now = tonumber(ARGV[2])
local expiresAt = tonumber(ARGV[3])
local limit = tonumber(ARGV[4])

-- Xóa user hết hạn.
redis.call("ZREMRANGEBYSCORE", activeKey, "-inf", now)

-- Chuyển những người đang chờ vào slot trống.
local activeCount = redis.call("ZCARD", activeKey)

while activeCount < limit do
    local popped = redis.call("ZPOPMIN", queueKey, 1)

    if not popped or #popped < 1 then
        break
    end

    redis.call("ZADD", activeKey, expiresAt, popped[1])
    activeCount = activeCount + 1
end

-- User đã được admitted.
if redis.call("ZSCORE", activeKey, userId) then
    return {"ADMITTED", 0, 0}
end

-- User vẫn đang trong queue.
local rank = redis.call("ZRANK", queueKey, userId)

if rank ~= false and rank ~= nil then
    local total = redis.call("ZCARD", queueKey)

    return {"QUEUED", rank + 1, total}
end

-- Chỉ admit user mới khi không còn ai trong queue.
activeCount = redis.call("ZCARD", activeKey)
local queueCount = redis.call("ZCARD", queueKey)

if activeCount < limit and queueCount == 0 then
    redis.call("ZADD", activeKey, expiresAt, userId)

    return {"ADMITTED", 0, 0}
end

-- Thêm user mới vào cuối queue.
local seq = redis.call("INCR", seqKey)

redis.call("ZADD", queueKey, "NX", seq, userId)

local newRank = redis.call("ZRANK", queueKey, userId) or 0
local total = redis.call("ZCARD", queueKey)

return {"QUEUED", newRank + 1, total}
`;

/**
 * Giải phóng slot và chuyển người tiếp theo vào active.
 */
const RELEASE_LUA = `
local activeKey = KEYS[1]
local queueKey = KEYS[2]

local userId = ARGV[1]
local now = tonumber(ARGV[2])
local expiresAt = tonumber(ARGV[3])
local limit = tonumber(ARGV[4])

-- Xóa user cần giải phóng.
redis.call("ZREM", activeKey, userId)
redis.call("ZREM", queueKey, userId)

-- Xóa user hết hạn.
redis.call("ZREMRANGEBYSCORE", activeKey, "-inf", now)

-- Chuyển tất cả người đang chờ vào slot còn trống.
local activeCount = redis.call("ZCARD", activeKey)
local firstPromoted = ""

while activeCount < limit do
    local popped = redis.call("ZPOPMIN", queueKey, 1)

    if not popped or #popped < 1 then
        break
    end

    local nextUser = popped[1]

    redis.call("ZADD", activeKey, expiresAt, nextUser)

    if firstPromoted == "" then
        firstPromoted = nextUser
    end

    activeCount = activeCount + 1
end

return firstPromoted
`;

function keysFor(eventId) {
    return [
        `waiting:active:${eventId}`,
        `waiting:queue:${eventId}`,
        `waiting:seq:${eventId}`,
    ];
}

function getRedisOrThrow() {
    const redis = getRedisClient();

    if (!redis) {
        throw new AppException(
            "Waiting Room hiện không khả dụng. Vui lòng thử lại sau.",
            503
        );
    }

    return redis;
}

/**
 * Đăng ký hoặc kiểm tra trạng thái Waiting Room.
 */
async function enterWaitingRoom(eventId, userId) {
    if (!eventId || !userId) {
        throw new AppException("Thiếu thông tin Waiting Room", 400);
    }

    try {
        const redis = getRedisOrThrow();

        const now = Date.now();
        const expiresAt = now + ACTIVE_TTL_MS;

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
            status: result?.[0] || "QUEUED",
            position: Number(result?.[1] || 0),
            total: Number(result?.[2] || 0),
        };
    } catch (error) {
        if (error instanceof AppException) {
            throw error;
        }

        throw new AppException(
            "Không thể kết nối Waiting Room. Vui lòng thử lại sau.",
            503
        );
    }
}

/**
 * Giải phóng slot của user.
 *
 * Đồng thời chuyển người tiếp theo trong queue vào active.
 */
async function releaseWaitingRoomSlot(eventId, userId) {
    if (!eventId || !userId) return null;

    try {
        const redis = getRedisOrThrow();

        const now = Date.now();
        const expiresAt = now + ACTIVE_TTL_MS;

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
    } catch (error) {
        console.error("[WaitingRoom] Release slot failed:", error);
        throw error;
    }
}

module.exports = {
    enterWaitingRoom,
    releaseWaitingRoomSlot,
    MAX_ACTIVE_BOOKERS,
    ACTIVE_TTL_MS,
};