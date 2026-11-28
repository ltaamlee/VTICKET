import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { createRedisConnection, createTicketEmailQueue } from "./ticketEmail.queue.mjs";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)), override: true });
const { default: prisma } = await import("../config/prisma.js");
const connection = createRedisConnection();
const queue = createTicketEmailQueue(connection);
queue.on("error", (error) => console.error("[TicketEmail] Lỗi queue:", error.code || error.name));

try {
    const jobs = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
    const deliveries = await prisma.ticketEmailDelivery.groupBy({ by: ["status"], _count: { _all: true } });
    console.log(JSON.stringify({ jobs, deliveries }, null, 2));
} finally {
    await queue.close();
    await connection.quit();
    await prisma.$disconnect();
}
