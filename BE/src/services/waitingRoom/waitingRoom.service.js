const crypto = require("node:crypto");
const Redis = require("ioredis");
const { AppException, BadRequestException } = require("../../exceptions");

const script = `
local waiting, waitingExpiry, active, tokens, sequence = KEYS[1], KEYS[2], KEYS[3], KEYS[4], KEYS[5]
local user, action, newToken = ARGV[1], ARGV[2], ARGV[3]
local capacity, admissionMs, waitingMs, keyTtlMs = tonumber(ARGV[4]), tonumber(ARGV[5]), tonumber(ARGV[6]), tonumber(ARGV[7])
local time = redis.call('TIME')
local now = time[1] * 1000 + math.floor(time[2] / 1000)

for _, key in ipairs({waitingExpiry, active}) do
    local expired = redis.call('ZRANGEBYSCORE', key, '-inf', now, 'LIMIT', 0, 100)
    for _, member in ipairs(expired) do
        redis.call('ZREM', waiting, member)
        redis.call('ZREM', waitingExpiry, member)
        redis.call('ZREM', active, member)
        redis.call('HDEL', tokens, member)
    end
end

if action == 'leave' then
    redis.call('ZREM', waiting, user)
    redis.call('ZREM', waitingExpiry, user)
    redis.call('ZREM', active, user)
    redis.call('HDEL', tokens, user)
elseif action == 'join' and not redis.call('ZSCORE', waiting, user) and not redis.call('ZSCORE', active, user) then
    local next = redis.call('INCR', sequence)
    redis.call('ZADD', waiting, next, user)
    redis.call('ZADD', waitingExpiry, now + waitingMs, user)
    redis.call('HSET', tokens, user, newToken)
end

local processed = 0
while redis.call('ZCARD', active) < capacity and processed < 100 do
    local head = redis.call('ZRANGE', waiting, 0, 0)[1]
    if not head then break end
    local expiry = tonumber(redis.call('ZSCORE', waitingExpiry, head))
    local token = redis.call('HGET', tokens, head)
    if not expiry or not token then return redis.error_reply('Inconsistent waiting room state') end
    redis.call('ZREM', waiting, head)
    redis.call('ZREM', waitingExpiry, head)
    if expiry <= now then
        redis.call('HDEL', tokens, head)
    else
        redis.call('ZADD', active, now + admissionMs, head)
    end
    processed = processed + 1
end

for _, key in ipairs(KEYS) do
    if redis.call('EXISTS', key) == 1 then redis.call('PEXPIRE', key, keyTtlMs) end
end

local admittedUntil = redis.call('ZSCORE', active, user)
if admittedUntil then
    local token = redis.call('HGET', tokens, user)
    if not token then return redis.error_reply('Inconsistent admission state') end
    return {'ADMITTED', token, admittedUntil}
end
local rank = redis.call('ZRANK', waiting, user)
if rank then return {'WAITING', tostring(rank + 1), redis.call('ZSCORE', waitingExpiry, user)} end
return {'NOT_WAITING'}
`;

function positiveInteger(name, fallback, min, max) {
    const raw = process.env[name];
    const value = raw === undefined ? fallback : Number(raw);
    if (!Number.isSafeInteger(value) || value < min || value > max) {
        throw new AppException(`${name} không hợp lệ`, 503);
    }
    return value;
}

function options() {
    return {
        capacity: positiveInteger("WAITING_ROOM_CAPACITY", 100, 1, 10000),
        admissionMs: positiveInteger("WAITING_ROOM_ADMISSION_SECONDS", 900, 1, 86400) * 1000,
        waitingMs: positiveInteger("WAITING_ROOM_WAIT_SECONDS", 3600, 1, 86400) * 1000,
    };
}

let connection;
function getConnection() {
    if (connection) return connection;
    if (!process.env.REDIS_URL) throw new AppException("Chưa cấu hình REDIS_URL cho phòng chờ", 503);
    let url;
    try {
        url = new URL(process.env.REDIS_URL);
    } catch {
        throw new AppException("REDIS_URL không hợp lệ", 503);
    }
    if (!["redis:", "rediss:"].includes(url.protocol)) throw new AppException("REDIS_URL không hợp lệ", 503);
    connection = new Redis(process.env.REDIS_URL, {
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy: (attempt) => Math.min(attempt * 100, 1000),
    });
    connection.on("error", (error) => console.error("[WaitingRoom] Lỗi Redis:", error.code || error.name));
    return connection;
}

function keys(eventId) {
    const prefix = `waiting-room:{${eventId}}`;
    return [`${prefix}:waiting`, `${prefix}:waiting-expiry`, `${prefix}:active`, `${prefix}:tokens`, `${prefix}:sequence`];
}

async function update({ eventId, userId, action }) {
    if (!/^[a-f\d]{24}$/i.test(eventId || "") || !/^[a-f\d]{24}$/i.test(userId || "")) {
        throw new BadRequestException("Sự kiện hoặc người dùng không hợp lệ");
    }
    const config = options();
    const token = action === "join" ? crypto.randomBytes(32).toString("hex") : "";
    let result;
    try {
        result = await getConnection().eval(script, 5, ...keys(eventId), userId, action, token,
            config.capacity, config.admissionMs, config.waitingMs,
            Math.max(config.admissionMs, config.waitingMs) + 3600000);
    } catch (error) {
        if (error instanceof AppException) throw error;
        console.error("[WaitingRoom] Không thể cập nhật hàng chờ:", error.code || error.name);
        throw new AppException("Phòng chờ tạm thời không khả dụng", 503);
    }
    if (result[0] === "ADMITTED" && typeof result[1] === "string" && /^[a-f\d]{64}$/.test(result[1]) &&
        Number.isSafeInteger(Number(result[2])) && Number(result[2]) > 0) {
        return { status: result[0], admissionToken: result[1], expiresAt: new Date(Number(result[2])) };
    }
    if (result[0] === "WAITING" && Number.isSafeInteger(Number(result[1])) && Number(result[1]) > 0 &&
        Number.isSafeInteger(Number(result[2])) && Number(result[2]) > 0) {
        return { status: result[0], position: Number(result[1]), expiresAt: new Date(Number(result[2])) };
    }
    if (result[0] === "NOT_WAITING") return { status: result[0] };
    throw new AppException("Trạng thái phòng chờ không hợp lệ", 503);
}

const join = ({ eventId, userId }) => update({ eventId, userId, action: "join" });
const getStatus = ({ eventId, userId }) => update({ eventId, userId, action: "status" });
const leave = ({ eventId, userId }) => update({ eventId, userId, action: "leave" });

async function verifyAdmission({ eventId, userId, admissionToken }) {
    if (typeof admissionToken !== "string" || !/^[a-f\d]{64}$/.test(admissionToken)) return false;
    const status = await getStatus({ eventId, userId });
    if (status.status !== "ADMITTED") return false;
    return crypto.timingSafeEqual(Buffer.from(admissionToken), Buffer.from(status.admissionToken));
}

module.exports = { join, getStatus, leave, verifyAdmission };
