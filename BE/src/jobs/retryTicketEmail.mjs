import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)), override: true });
const orderId = process.argv[2];
if (typeof orderId !== "string" || !/^[a-f\d]{24}$/i.test(orderId)) {
    throw new Error("Sử dụng: npm run queue:retry -- <orderId>");
}
const { default: prisma } = await import("../config/prisma.js");
try {
    const result = await prisma.ticketEmailDelivery.updateMany({
        where: {
            orderId,
            status: "FAILED",
            lastError: { in: ["SMTP_REJECTED", "SMTP_NOT_CONFIGURED", "PREPARATION_FAILED", "JOB_FAILED"] },
        },
        data: { status: "RETRY_REQUESTED", lastError: null },
    });
    if (result.count !== 1) throw new Error("Yêu cầu không thất bại hoặc cần đối soát; không thể tự gửi lại");
    console.log("Đã yêu cầu thử gửi lại; worker sẽ xử lý.");
} finally {
    await prisma.$disconnect();
}
