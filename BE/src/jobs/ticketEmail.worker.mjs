import path from "node:path";
import dotenv from "dotenv";
import { Worker } from "bullmq";
import { fileURLToPath } from "node:url";
import { createRedisConnection, createTicketEmailQueue, enqueueTicketEmail, QUEUE_NAME } from "./ticketEmail.queue.mjs";
import { createTicketEmailProcessor } from "./ticketEmail.processor.mjs";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)), override: true });

export async function startTicketEmailWorker({ disconnectPrisma = false } = {}) {
    const concurrency = Number(process.env.TICKET_EMAIL_CONCURRENCY || 5);
    if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 100) {
        throw new Error("TICKET_EMAIL_CONCURRENCY phải từ 1 đến 100");
    }

    const { default: prisma } = await import("../config/prisma.js");
    const { default: emailService } = await import("../shared/email.service.js");
    const connection = createRedisConnection();
    const queue = createTicketEmailQueue(connection);
    queue.on("error", (error) => console.error("[TicketEmail] Lỗi queue:", error.code || error.name));
    const worker = new Worker(QUEUE_NAME, createTicketEmailProcessor({ prisma, emailService }), {
        connection,
        concurrency,
    });
    worker.on("completed", (job) => console.log("[TicketEmail] Hoàn tất job:", job.id));
    worker.on("failed", (job, error) => console.error("[TicketEmail] Job thất bại:", job?.id, error.code || error.name));
    worker.on("error", (error) => console.error("[TicketEmail] Lỗi worker:", error.code || error.name));

    let dispatching = null;
    function dispatchPending() {
        if (dispatching) return;
        dispatching = (async () => {
            await prisma.ticketEmailDelivery.updateMany({
                where: { status: "SENDING", updatedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) } },
                data: { status: "REVIEW_REQUIRED", lastError: "SMTP_RESULT_UNKNOWN" },
            });
            let lastId;
            do {
                const records = await prisma.ticketEmailDelivery.findMany({
                    where: { status: { in: ["PENDING", "RETRY_REQUESTED"] }, ...(lastId ? { id: { gt: lastId } } : {}) },
                    orderBy: { id: "asc" },
                    select: { id: true, orderId: true, status: true },
                    take: 100,
                });
                for (const record of records) {
                    const job = await queue.getJob(`order-${record.orderId}`);
                    const state = job && await job.getState();
                    if (record.status === "RETRY_REQUESTED" && state === "failed") {
                        await job.retry("failed", { resetAttemptsMade: true, resetAttemptsStarted: true });
                    } else if (state === "failed" || state === "completed") {
                        await prisma.ticketEmailDelivery.updateMany({
                            where: { id: record.id, status: record.status },
                            data: {
                                status: state === "failed" ? "FAILED" : "REVIEW_REQUIRED",
                                lastError: state === "failed" ? "JOB_FAILED" : "JOB_STATE_MISMATCH",
                            },
                        });
                    } else if (!job) {
                        await enqueueTicketEmail(queue, record.orderId);
                    }
                }
                lastId = records.length === 100 ? records[records.length - 1].id : null;
            } while (lastId);
        })().catch((error) => {
            console.error("[TicketEmail] Không thể đưa yêu cầu vào queue:", error.code || error.name);
        }).finally(() => { dispatching = null; });
    }

    dispatchPending();
    const timer = setInterval(dispatchPending, 10000);
    if (!disconnectPrisma) timer.unref();

    let stopping = false;
    async function shutdown() {
        if (stopping) return;
        stopping = true;
        clearInterval(timer);
        if (dispatching) await dispatching;
        await worker.close();
        await queue.close();
        await connection.quit();
        if (disconnectPrisma) await prisma.$disconnect();
    }

    return { shutdown };
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
    const { shutdown } = await startTicketEmailWorker({ disconnectPrisma: true });
    for (const signal of ["SIGINT", "SIGTERM"]) {
        process.on(signal, () => {
            shutdown().catch((error) => {
                console.error("[TicketEmail] Không thể dừng worker:", error.code || error.name);
                process.exitCode = 1;
            });
        });
    }
}
