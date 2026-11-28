const {
    HOLD_MS,
    assertId,
    crypto,
    prisma,
    paymentService,
    walletService,
    BadRequestException,
    ConflictException,
    NotFoundException,
} = require("./resaleOrder.shared");

/**
 * Lấy chi tiết đơn mua vé bán lại của người dùng.
 */
async function getResaleOrder({ userId, orderId }) {
    assertId(userId, "ID người dùng");
    assertId(orderId, "ID đơn hàng");

    const order = await prisma.resaleOrder.findFirst({
        where: { id: orderId, userId },
        include: {
            resale: { include: { ticket: require("./resaleOrder.shared").ticketDetails } },
        },
    });

    if (!order) throw new NotFoundException("Không tìm thấy đơn mua vé bán lại");

    return order;
}

/**
 * Khởi tạo thanh toán cho đơn mua vé bán lại qua cổng SePay.
 */
async function checkoutResaleOrder({ userId, orderId }) {
    assertId(userId, "ID người dùng");
    assertId(orderId, "ID đơn hàng");

    const order = await getResaleOrder({ userId, orderId });

    if (order.status !== "PENDING_PAYMENT") {
        throw new ConflictException("Đơn hàng không còn trong thời gian thanh toán");
    }

    if (!order.expiresAt || order.expiresAt <= new Date()) {
        await cancelResaleOrder({ userId, orderId, status: "EXPIRED" });
        throw new ConflictException("Đơn hàng đã hết thời gian thanh toán");
    }

    return paymentService.checkoutFields(
        {
            id: order.id,
            orderCode: order.orderCode,
            userId: order.userId,
            totalAmount: Math.round(order.totalAmount),
        },
        {
            returnPath: `/resales/orders/${encodeURIComponent(order.id)}`,
            description: `Thanh toan don hang ve ban lai ${order.orderCode}`,
        }
    );
}

/**
 * Thanh toán đơn mua vé bán lại bằng số dư ví điện tử.
 */
async function payWithWallet({ userId, orderId }) {
    assertId(userId, "ID người dùng");
    assertId(orderId, "ID đơn hàng");

    const order = await getResaleOrder({ userId, orderId });

    if (order.status !== "PENDING_PAYMENT") {
        throw new ConflictException("Đơn hàng không còn trong thời gian thanh toán");
    }

    const walletSettings = await walletService.getWalletSettings();
    if (!walletSettings.enabled || !walletSettings.allowWalletPayment) {
        throw new BadRequestException(
            "Thanh toán bằng ví điện tử hiện không khả dụng. Vui lòng chọn cổng thanh toán khác."
        );
    }

    if (!order.expiresAt || order.expiresAt <= new Date()) {
        await cancelResaleOrder({ userId, orderId, status: "EXPIRED" });
        throw new ConflictException("Đơn hàng đã hết thời gian thanh toán");
    }

    const result = await prisma.$transaction(async (tx) => {
        const fresh = await tx.resaleOrder.findUnique({ where: { id: orderId } });
        if (!fresh || fresh.status !== "PENDING_PAYMENT") {
            throw new ConflictException("Đơn hàng vừa được cập nhật, vui lòng thử lại");
        }

        const walletResult = await walletService.debitInTransaction(tx, {
            userId,
            amount: fresh.totalAmount,
            resaleOrderId: fresh.id,
            description: `Thanh toán mua vé bán lại ${fresh.orderCode}`,
        });

        const paid = await tx.resaleOrder.updateMany({
            where: { id: orderId, status: "PENDING_PAYMENT" },
            data: {
                status: "PAID",
                method: "WALLET",
                paidAt: new Date(),
                transactionRef: walletResult.transaction.id,
            },
        });

        if (!paid.count) {
            throw new ConflictException("Đơn hàng vừa được cập nhật, vui lòng thử lại");
        }

        await finalizeResalePurchase(tx, { resaleOrderId: orderId });

        return tx.resaleOrder.findUnique({
            where: { id: orderId },
            include: {
                resale: { include: { ticket: require("./resaleOrder.shared").ticketDetails } },
            },
        });
    }).catch((error) => {
        if (error?.code === "P2034") {
            throw new ConflictException("Đơn hàng đang được xử lý, vui lòng thử lại");
        }
        throw error;
    });

    return result;
}

/**
 * Chuyển quyền sở hữu vé cho người mua khi thanh toán thành công.
 *
 * Mã vé và QR được tạo MỚI hoàn toàn cho người mua.
 */
async function finalizeResalePurchase(tx, { resaleOrderId }) {
    const order = await tx.resaleOrder.findUnique({
        where: { id: resaleOrderId },
        include: { resale: { include: { ticket: true } } },
    });

    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");

    const listing = order.resale;
    const now = new Date();

    const newTicketCode = `T${crypto.randomBytes(16).toString("hex").toUpperCase()}`;
    const newQrToken = crypto.randomBytes(32).toString("hex");

    const claimed = await tx.reSale.updateMany({
        where: { id: listing.id, status: "RESERVED" },
        data: { status: "SOLD", buyerId: order.userId, qrCode: newQrToken },
    });

    if (!claimed.count) {
        throw new ConflictException("Vé vừa được người khác mua");
    }

    const transferred = await tx.ticket.updateMany({
        where: {
            id: listing.ticketId,
            userId: listing.sellerId,
            status: "RESERVED",
            checkInAt: undefined,
        },
        data: {
            userId: order.userId,
            status: "ISSUED",
            issuedAt: now,
            ticketCode: newTicketCode,
            qrToken: newQrToken,
        },
    });

    if (!transferred.count) {
        throw new ConflictException("Không thể chuyển quyền sở hữu vé");
    }

    // Cộng tiền cho người bán vào ví
    await walletService.creditInTransaction(tx, {
        userId: listing.sellerId,
        amount: order.sellerAmount,
        resaleOrderId: order.id,
        description: `Bán vé bán lại ${order.orderCode}`,
    });

    // Thông báo realtime cho người bán và người mua (nếu cấu hình cho phép)
    await notifyResaleParticipants(order, listing);

    return { ticketCode: newTicketCode, qrToken: newQrToken };
}

/**
 * Gửi thông báo realtime cho cả người bán và người mua sau khi giao dịch
 * bán lại hoàn tất. Lỗi thông báo không được làm fail giao dịch.
 */
async function notifyResaleParticipants(order, listing) {
    try {
        const { notifyResaleSold, notifyResalePaymentSuccess, getEventName } =
            require("./resaleOrder.notify");

        const eventName = await getEventName(listing.ticketId);

        await notifyResaleSold({
            sellerId: listing.sellerId,
            buyerId: order.userId,
            orderCode: order.orderCode,
            amount: order.sellerAmount,
            eventName,
        });

        await notifyResalePaymentSuccess({
            buyerId: order.userId,
            orderCode: order.orderCode,
            amount: order.totalAmount,
            eventName,
        });
    } catch (error) {
        console.error(
            "[Notification] Gửi thông báo giao dịch bán lại lỗi:",
            error.code || error.name || error.message
        );
    }
}

module.exports = {
    getResaleOrder,
    checkoutResaleOrder,
    payWithWallet,
    finalizeResalePurchase,
    cancelResaleOrder: require("./resaleOrder.cancel").cancelResaleOrder,
};
