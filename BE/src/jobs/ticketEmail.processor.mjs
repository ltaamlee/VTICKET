import QRCode from "qrcode";
import { UnrecoverableError } from "bullmq";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

function frontendUrl() {
    const url = new URL(process.env.FRONTEND_URL);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash ||
        (process.env.NODE_ENV === "production" && url.protocol !== "https:")) {
        throw new Error("FRONTEND_URL không hợp lệ");
    }
    return url.toString().replace(/\/+$/, "");
}

async function prepareEmail(prisma, orderId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: { select: { email: true } },
            orderItems: {
                include: {
                    ticketType: { include: { event: true, session: true, zone: true } },
                    tickets: { include: { seat: true } },
                },
            },
        },
    });
    if (!order || order.status !== "PAID" || !order.user?.email || !order.orderItems.length) {
        throw new Error("Đơn hàng không đủ điều kiện gửi vé");
    }
    const attachments = [];
    const sections = [];
    for (const item of order.orderItems) {
        if (item.tickets.length !== item.quantity) throw new Error("Đơn hàng thiếu vé");
        for (const ticket of item.tickets) {
            if (!["ISSUED", "CHECKED_IN"].includes(ticket.status)) throw new Error("Vé chưa được phát hành");
            const cid = `ticket-${ticket.id}@vticket`;
            attachments.push({ filename: `${ticket.ticketCode}.png`, content: await QRCode.toBuffer(ticket.qrToken), cid });
            const session = item.ticketType.session;
            const seat = ticket.seat ? `${ticket.seat.rowLabel}${ticket.seat.seatNumber}` : "";
            sections.push(`<div><h3>${escapeHtml(item.ticketType.event.name)}</h3>
                <p>Hạng vé: ${escapeHtml(item.ticketType.name)} · Mã vé: ${escapeHtml(ticket.ticketCode)}</p>
                <p>Suất: ${escapeHtml(new Date(session?.startAt || item.ticketType.event.startAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }))}</p>
                <p>Khu vực: ${escapeHtml(item.ticketType.zone.name)}${seat ? ` · Ghế: ${escapeHtml(seat)}` : ""}</p>
                <img src="cid:${cid}" alt="QR vé ${escapeHtml(ticket.ticketCode)}" width="200" height="200"></div>`);
        }
    }
    const link = `${frontendUrl()}/orders/${encodeURIComponent(order.id)}`;
    return {
        to: order.user.email,
        subject: `[VTicket] Vé điện tử - ${order.orderCode}`,
        html: `<p>Đơn hàng ${escapeHtml(order.orderCode)} đã được xác nhận.</p>${sections.join("")}
            <p>Vui lòng giữ kín mã QR. <a href="${escapeHtml(link)}">Xem đơn hàng</a></p>`,
        attachments,
        messageId: `<ticket-${order.id}@vticket>`,
    };
}

export function createTicketEmailProcessor({ prisma, emailService }) {
    return async (job) => {
        const orderId = job.data.orderId;
        if (typeof orderId !== "string" || !/^[a-f\d]{24}$/i.test(orderId)) {
            throw new UnrecoverableError("Mã đơn hàng không hợp lệ");
        }
        const delivery = await prisma.ticketEmailDelivery.findUnique({ where: { orderId } });
        if (!delivery) throw new UnrecoverableError("Không tìm thấy yêu cầu gửi vé");
        if (["SENT", "FAILED", "REVIEW_REQUIRED"].includes(delivery.status)) return;
        if (delivery.status === "SENDING") {
            await prisma.ticketEmailDelivery.updateMany({
                where: { orderId, status: "SENDING" },
                data: { status: "REVIEW_REQUIRED", lastError: "SMTP_RESULT_UNKNOWN" },
            });
            throw new UnrecoverableError("Kết quả gửi thư không xác định; cần đối soát");
        }
        if (!["PENDING", "RETRY_REQUESTED"].includes(delivery.status)) throw new UnrecoverableError("Trạng thái gửi vé không hợp lệ");

        const finalAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 1);
        let message;
        try {
            message = await prepareEmail(prisma, orderId);
        } catch (error) {
            if (finalAttempt) await prisma.ticketEmailDelivery.updateMany({
                where: { orderId, status: { in: ["PENDING", "RETRY_REQUESTED"] } },
                data: { status: "FAILED", lastError: "PREPARATION_FAILED" },
            });
            throw error;
        }
        const claimed = await prisma.ticketEmailDelivery.updateMany({
            where: { orderId, status: { in: ["PENDING", "RETRY_REQUESTED"] } },
            data: { status: "SENDING", lastError: null },
        });
        if (claimed.count !== 1) throw new UnrecoverableError("Yêu cầu gửi vé đã được xử lý");

        try {
            await emailService.sendTicketEmail(message);
        } catch (error) {
            const rejected = Number.isInteger(error.responseCode) && error.responseCode >= 400 && error.responseCode < 600;
            const safeToRetry = rejected || error.code === "SMTP_NOT_CONFIGURED";
            await prisma.ticketEmailDelivery.updateMany({
                where: { orderId, status: "SENDING" },
                data: {
                    status: safeToRetry ? (finalAttempt ? "FAILED" : "PENDING") : "REVIEW_REQUIRED",
                    lastError: error.code === "SMTP_NOT_CONFIGURED" ? "SMTP_NOT_CONFIGURED" : safeToRetry ? "SMTP_REJECTED" : "SMTP_RESULT_UNKNOWN",
                },
            });
            if (!safeToRetry) throw new UnrecoverableError("Kết quả gửi thư không xác định; cần đối soát");
            throw error;
        }
        const sent = await prisma.ticketEmailDelivery.updateMany({
            where: { orderId, status: "SENDING" },
            data: { status: "SENT", lastError: null },
        });
        if (sent.count !== 1) throw new UnrecoverableError("Không thể xác nhận trạng thái gửi vé");
    };
}
