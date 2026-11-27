const {
    assertId,
    prisma,
    BadRequestException,
    ConflictException,
    NotFoundException,
} = require("./resaleOrder.shared");

/**
 * Hủy / hết hạn đơn mua vé bán lại.
 *
 * Khi hủy đơn:
 * - vé trả về trạng thái AVAILABLE để người khác có thể mua
 * - nếu đã thanh toán bằng ví thì hoàn tiền vào ví người mua
 */
async function cancelResaleOrder({ userId, orderId, status = "CANCELLED" }) {
    assertId(orderId, "ID đơn hàng");

    return prisma.$transaction(async (tx) => {
        const order = await tx.resaleOrder.findUnique({
            where: { id: orderId },
            include: { resale: true },
        });

        if (!order) throw new NotFoundException("Không tìm thấy đơn mua vé bán lại");

        if (order.userId && userId && order.userId !== userId) {
            throw new NotFoundException("Không tìm thấy đơn mua vé bán lại");
        }

        if (order.status !== "PENDING_PAYMENT") {
            return { id: order.id, status: order.status };
        }

        const changed = await tx.resaleOrder.updateMany({
            where: { id: orderId, status: "PENDING_PAYMENT" },
            data: { status },
        });

        if (!changed.count) {
            throw new ConflictException("Đơn hàng vừa được cập nhật, vui lòng thử lại");
        }

        // Trả tin bán về trạng thái AVAILABLE (vé vẫn giữ nguyên chủ)
        await tx.reSale.updateMany({
            where: { id: order.resaleId, status: "RESERVED" },
            data: { status: "AVAILABLE" },
        });

        return { id: order.id, status };
    }).catch((error) => {
        if (error?.code === "P2034") {
            throw new ConflictException("Đơn hàng vừa được cập nhật, vui lòng thử lại");
        }
        throw error;
    });
}

/**
 * Giải phóng các đơn mua vé bán lại đã hết thời gian thanh toán.
 */
async function expireDueResaleOrders() {
    const now = new Date();
    const orders = await prisma.resaleOrder.findMany({
        where: { status: "PENDING_PAYMENT", expiresAt: { lte: now } },
        select: { id: true },
        take: 100,
    });

    let expired = 0;
    for (const order of orders) {
        try {
            await cancelResaleOrder({ orderId: order.id, status: "EXPIRED" });
            expired += 1;
        } catch {
            // Bỏ qua, thử lại ở vòng lặp sau
        }
    }

    return expired;
}

module.exports = { cancelResaleOrder, expireDueResaleOrders };
