/**
 * Resale Notification Helper
 *
 * Gom các thông báo realtime của sàn bán lại vé vào một chỗ để
 * dễ đọc và tránh lặp code giữa các luồng (ví / SePay / huỷ đơn).
 *
 * Mọi thông báo đều tự kiểm tra cấu hình Admin > System Setting > Notification.
 */

const { notificationService, prisma } = require("./resaleOrder.shared");

/**
 * Gửi thông báo, bỏ qua lỗi để không ảnh hưởng luồng chính.
 * @private
 */
async function safeNotify(payload) {
    try {
        await notificationService.notify(payload);
    } catch (error) {
        console.error(
            "[Notification] Gửi thông báo bán lại lỗi:",
            error.code || error.name || error.message
        );
    }
}

/**
 * Thông báo cho người bán: vé của họ đã được bán thành công.
 */
async function notifyResaleSold({ sellerId, buyerId, orderCode, amount, eventName }) {
    const formatted = new Intl.NumberFormat("vi-VN").format(Number(amount) || 0);

    await safeNotify({
        type: "RESALE_SOLD",
        userId: sellerId,
        title: "Vé của bạn đã được bán thành công",
        body: `Vé ${eventName ? `cho sự kiện "${eventName}" ` : ""}đã được bán với giá ${formatted} đ. Số tiền đã được cộng vào ví điện tử của bạn.`,
        link: "/my-resales",
        metadata: { orderCode, amount, buyerId },
    });
}

/**
 * Thông báo cho người mua: thanh toán đơn bán lại thành công.
 */
async function notifyResalePaymentSuccess({ buyerId, orderCode, amount, eventName }) {
    const formatted = new Intl.NumberFormat("vi-VN").format(Number(amount) || 0);

    await safeNotify({
        type: "RESALE_PAYMENT_SUCCESS",
        userId: buyerId,
        title: "Thanh toán vé bán lại thành công",
        body: `Thanh toán đơn ${orderCode}${eventName ? ` cho sự kiện "${eventName}"` : ""} thành công với số tiền ${formatted} đ. Vé đã được chuyển vào tài khoản của bạn.`,
        link: "/my-tickets",
        metadata: { orderCode, amount },
    });
}

/**
 * Thông báo cho người bán: đơn bán lại đã bị huỷ / hết hạn.
 */
async function notifyResaleCancelled({ sellerId, orderCode, reason }) {
    await safeNotify({
        type: "RESALE_CANCELLED",
        userId: sellerId,
        title: "Đơn bán lại đã bị huỷ",
        body: `Đơn ${orderCode} đã bị huỷ${reason ? `: ${reason}` : "."}. Vé của bạn đã được đưa trở lại sàn.`,
        link: "/my-resales",
        metadata: { orderCode, reason },
    });
}

/**
 * Thông báo cho người bán: có người đặt mua vé của họ.
 */
async function notifyResaleCreated({ sellerId, orderCode, amount, eventName }) {
    const formatted = new Intl.NumberFormat("vi-VN").format(Number(amount) || 0);

    await safeNotify({
        type: "RESALE_CREATED",
        userId: sellerId,
        title: "Có người đang mua vé của bạn",
        body: `Đơn ${orderCode} với giá ${formatted} đ${eventName ? ` cho sự kiện "${eventName}"` : ""} đang chờ thanh toán.`,
        link: "/my-resales",
        metadata: { orderCode, amount },
    });
}

/**
 * Lấy tên sự kiện (nếu có) để đưa vào nội dung thông báo.
 */
async function getEventName(ticketId) {
    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: { event: { select: { name: true } } },
        });
        return ticket?.event?.name || null;
    } catch {
        return null;
    }
}

module.exports = {
    safeNotify,
    notifyResaleSold,
    notifyResalePaymentSuccess,
    notifyResaleCancelled,
    notifyResaleCreated,
    getEventName,
};
