import { Queue } from "bullmq";
import Redis from "ioredis";

export const QUEUE_NAME = "ticket-email";

export function createRedisConnection() {
    if (!process.env.REDIS_URL) throw new Error("Thiếu REDIS_URL");
    const url = new URL(process.env.REDIS_URL);
    if (!["redis:", "rediss:"].includes(url.protocol)) throw new Error("REDIS_URL không hợp lệ");
    const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    connection.on("error", (error) => console.error("[Redis] Lỗi kết nối:", error.code || error.name));
    return connection;
}

export function createTicketEmailQueue(connection) {
    return new Queue(QUEUE_NAME, {
        connection,
        defaultJobOptions: {
            attempts: 5,
            backoff: { type: "exponential", delay: 5000 },
            removeOnComplete: false,
            removeOnFail: false,
        },
    });
}

export async function enqueueTicketEmail(queue, orderId) {
    return queue.add("send", { orderId }, { jobId: `order-${orderId}` });
}
