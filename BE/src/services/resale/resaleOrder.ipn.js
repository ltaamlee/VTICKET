const {
    prisma,
    BadRequestException,
    ConflictException,
} = require("./resaleOrder.shared");

/**
 * Xử lý IPN thanh toán cho đơn mua vé bán lại (ResaleOrder).
 *
 * Gọi bên trong transaction của payment.service.
 */
async function processResaleOrderPaid(tx, { payload, receipt, transactionId, invoiceNumber, resaleOrder }) {
    const { validatePaidIpn } = require("../payment/payment.service");
    const { finalizeResalePurchase } = require("./resaleOrder.pay");

    try {
        validatePaidIpn(payload, {
            orderCode: resaleOrder.orderCode,
            totalAmount: Math.round(resaleOrder.totalAmount),
        });
    } catch (error) {
        if (!(error instanceof BadRequestException)) throw error;
        receipt.reason = "PAYMENT_MISMATCH";
        return tx.sePayNotification.create({ data: receipt });
    }

    const now = new Date();

    if (resaleOrder.status === "PENDING_PAYMENT" && resaleOrder.expiresAt && resaleOrder.expiresAt <= now) {
        await tx.resaleOrder.updateMany({
            where: { id: resaleOrder.id, status: "PENDING_PAYMENT" },
            data: { status: "EXPIRED" },
        });
        await tx.reSale.updateMany({
            where: { id: resaleOrder.resaleId, status: "RESERVED" },
            data: { status: "AVAILABLE" },
        });
        receipt.reason = "ORDER_NOT_PAYABLE";
        return tx.sePayNotification.create({ data: receipt });
    }

    if (resaleOrder.status !== "PENDING_PAYMENT") {
        receipt.reason = "ORDER_NOT_PAYABLE";
        return tx.sePayNotification.create({ data: receipt });
    }

    const updated = await tx.resaleOrder.updateMany({
        where: { id: resaleOrder.id, status: "PENDING_PAYMENT" },
        data: {
            status: "PAID",
            method: "SEPAY",
            paidAt: now,
            transactionRef: transactionId,
        },
    });

    if (!updated.count) {
        throw new ConflictException("Đơn hàng vừa được cập nhật, vui lòng thử lại");
    }

    // Chuyển vé + tạo mã vé/QR mới cho người mua
    await finalizeResalePurchase(tx, { resaleOrderId: resaleOrder.id });

    receipt.outcome = "APPLIED";
    receipt.reason = null;
    return tx.sePayNotification.create({ data: receipt });
}

/**
 * Đồng bộ trạng thái đơn mua vé bán lại với SePay (polling fallback).
 */
async function syncResaleOrderWithSePay(invoiceNumber) {
    if (typeof invoiceNumber !== "string" || !invoiceNumber) return null;

    const prismaClient = prisma;

    const resaleOrder = await prismaClient.resaleOrder.findUnique({
        where: { orderCode: invoiceNumber },
    });

    if (!resaleOrder) return null;

    const { syncOrderWithSePay } = require("../payment/payment.service");
    return syncOrderWithSePay(invoiceNumber);
}

module.exports = { processResaleOrderPaid, syncResaleOrderWithSePay };
