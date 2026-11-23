const crypto = require("node:crypto");
const { SePayPgClient } = require("sepay-pg-node");
const { AppException, BadRequestException, UnauthorizedException } = require("../../exceptions");

function getConfig() {
    const { SEPAY_ENV, SEPAY_MERCHANT_ID, SEPAY_SECRET_KEY, SEPAY_IPN_SECRET, FRONTEND_URL } = process.env;
    if (!["sandbox", "production"].includes(SEPAY_ENV) ||
        !SEPAY_MERCHANT_ID || !SEPAY_SECRET_KEY || !SEPAY_IPN_SECRET || !FRONTEND_URL) {
        throw new AppException("Thiếu hoặc sai cấu hình SePay trong biến môi trường", 503);
    }

    let frontendUrl;
    try {
        frontendUrl = new URL(FRONTEND_URL);
    } catch {
        throw new AppException("FRONTEND_URL không hợp lệ", 503);
    }
    if (!["http:", "https:"].includes(frontendUrl.protocol) ||
        frontendUrl.username || frontendUrl.password ||
        frontendUrl.search || frontendUrl.hash) {
        throw new AppException("FRONTEND_URL không hợp lệ", 503);
    }
    if (SEPAY_ENV === "production" && frontendUrl.protocol !== "https:") {
        throw new AppException("FRONTEND_URL phải dùng HTTPS trong môi trường production", 503);
    }
    return {
        env: SEPAY_ENV,
        merchantId: SEPAY_MERCHANT_ID,
        secretKey: SEPAY_SECRET_KEY,
        ipnSecret: SEPAY_IPN_SECRET,
        frontendUrl: frontendUrl.toString().replace(/\/+$/, ""),
    };
}

function checkoutFields(order) {
    const config = getConfig();
    if (!order || typeof order.id !== "string" ||
        typeof order.orderCode !== "string" || !order.orderCode ||
        typeof order.userId !== "string" ||
        !Number.isSafeInteger(order.totalAmount) || order.totalAmount <= 0) {
        throw new BadRequestException("Thông tin đơn hàng không hợp lệ để thanh toán");
    }

    const client = new SePayPgClient({
        env: config.env,
        merchant_id: config.merchantId,
        secret_key: config.secretKey,
    });
    const returnUrl = `${config.frontendUrl}/orders/${encodeURIComponent(order.id)}`;
    return {
        url: client.checkout.initCheckoutUrl(),
        fields: client.checkout.initOneTimePaymentFields({
            operation: "PURCHASE",
            payment_method: "BANK_TRANSFER",
            order_invoice_number: order.orderCode,
            order_amount: order.totalAmount,
            currency: "VND",
            order_description: `Thanh toan don hang ${order.orderCode}`,
            customer_id: order.userId,
            success_url: `${returnUrl}?payment=success`,
            error_url: `${returnUrl}?payment=error`,
            cancel_url: `${returnUrl}?payment=cancel`,
        }),
    };
}

function authenticateIpn(secret) {
    if (!process.env.SEPAY_IPN_SECRET) {
        throw new AppException("Thiếu cấu hình xác thực IPN SePay", 503);
    }
    const expected = Buffer.from(process.env.SEPAY_IPN_SECRET);
    const received = Buffer.from(typeof secret === "string" ? secret : "");
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
        throw new UnauthorizedException("Xác thực IPN SePay thất bại");
    }
}

function parseVnd(value) {
    const text = String(value);
    if (!/^(?:0|[1-9]\d*)(?:\.0{1,2})?$/.test(text)) return null;
    const amount = Number(text);
    return Number.isSafeInteger(amount) ? amount : null;
}

function validatePaidIpn(payload, order) {
    const notification = payload?.order;
    const transaction = payload?.transaction;
    if (!order || typeof order.orderCode !== "string" ||
        !Number.isSafeInteger(order.totalAmount) || order.totalAmount <= 0 ||
        payload?.notification_type !== "ORDER_PAID" ||
        notification?.order_invoice_number !== order.orderCode ||
        notification?.order_status !== "CAPTURED" ||
        notification?.order_currency !== "VND" ||
        transaction?.transaction_status !== "APPROVED" ||
        transaction?.transaction_type !== "PAYMENT" ||
        transaction?.transaction_currency !== "VND" ||
        typeof transaction?.transaction_id !== "string" ||
        !transaction.transaction_id.trim() ||
        parseVnd(notification?.order_amount) !== order.totalAmount ||
        parseVnd(transaction?.transaction_amount) !== order.totalAmount) {
        throw new BadRequestException("Thông báo thanh toán SePay không khớp đơn hàng");
    }
    return { transactionId: transaction.transaction_id };
}

async function handleIpn(payload, secret) {
    authenticateIpn(secret);
    if (payload?.notification_type !== "ORDER_PAID") {
        throw new AppException("Loại thông báo SePay chưa được hỗ trợ; cần đối soát thủ công", 503);
    }
    const invoiceNumber = payload?.order?.order_invoice_number;
    const transactionId = payload?.transaction?.transaction_id;
    if (typeof invoiceNumber !== "string" || !invoiceNumber || invoiceNumber.length > 200 ||
        typeof transactionId !== "string" || !transactionId.trim() || transactionId.length > 200) {
        throw new BadRequestException("Thông báo SePay thiếu mã giao dịch hoặc đơn hàng");
    }

    const prisma = require("../../config/prisma");
    const ensurePaymentIndexes = require("./paymentIndexes");
    const { expireInTransaction, hasValidReservation } = require("../user/order.service");
    await ensurePaymentIndexes();
    try {
        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.sePayNotification.findUnique({ where: { transactionId } });
            if (existing) {
                if (existing.invoiceNumber !== invoiceNumber) {
                    throw new BadRequestException("Mã giao dịch SePay không khớp đơn hàng");
                }
                return existing;
            }
            const order = await tx.order.findUnique({
                where: { orderCode: invoiceNumber },
                include: { orderItems: { include: { tickets: { include: { seat: true } }, ticketType: { include: { zone: true } } } } },
            });
            const receipt = {
                transactionId,
                invoiceNumber,
                amount: String(payload.order?.order_amount ?? "").slice(0, 100),
                currency: String(payload.order?.order_currency ?? "").slice(0, 20),
                outcome: "REVIEW_REQUIRED",
                reason: "UNKNOWN_ORDER",
            };
            if (!order) return tx.sePayNotification.create({ data: receipt });

            try {
                validatePaidIpn(payload, order);
            } catch (error) {
                if (!(error instanceof BadRequestException)) throw error;
                receipt.reason = "PAYMENT_MISMATCH";
                return tx.sePayNotification.create({ data: receipt });
            }
            const now = new Date();
            if (order.status === "PENDING_PAYMENT" && order.expiresAt && order.expiresAt <= now) {
                await expireInTransaction(tx, order.id, now);
            }
            if (order.status !== "PENDING_PAYMENT" || !order.expiresAt || order.expiresAt <= now) {
                receipt.reason = "ORDER_NOT_PAYABLE";
                await tx.payment.create({
                    data: { orderId: order.id, transactionCode: transactionId, amount: order.totalAmount, method: "SEPAY", status: "REVIEW_REQUIRED" },
                });
                return tx.sePayNotification.create({ data: receipt });
            }
            const validReservations = await hasValidReservation(tx, order);
            if (!validReservations) {
                receipt.reason = "INVALID_RESERVATION";
                await tx.payment.create({
                    data: { orderId: order.id, transactionCode: transactionId, amount: order.totalAmount, method: "SEPAY", status: "REVIEW_REQUIRED" },
                });
                return tx.sePayNotification.create({ data: receipt });
            }
            const updated = await tx.order.updateMany({
                where: { id: order.id, status: "PENDING_PAYMENT", expiresAt: { gt: now } },
                data: { status: "PAID" },
            });
            if (!updated.count) throw new AppException("Không thể xác nhận trạng thái đơn hàng", 503);
            for (const item of order.orderItems) {
                const issued = await tx.ticket.updateMany({
                    where: { orderItemId: item.id, status: "RESERVED" },
                    data: { status: "ISSUED", issuedAt: now },
                });
                if (issued.count !== item.quantity) throw new AppException("Không thể phát hành đầy đủ vé", 503);
            }
            await tx.payment.create({
                data: { orderId: order.id, transactionCode: transactionId, amount: order.totalAmount, method: "SEPAY", status: "SUCCESS", paidAt: now },
            });
            receipt.outcome = "APPLIED";
            receipt.reason = null;
            return tx.sePayNotification.create({ data: receipt });
        });
        if (result.outcome === "REVIEW_REQUIRED") {
            console.error("[SePay] Giao dịch cần đối soát thủ công:", result.transactionId, result.invoiceNumber, result.reason);
        }
        return result;
    } catch (error) {
        if (error.code === "P2002") {
            const existing = await prisma.sePayNotification.findUnique({ where: { transactionId } });
            if (existing && existing.invoiceNumber === invoiceNumber) return existing;
        }
        throw error;
    }
}

module.exports = { checkoutFields, authenticateIpn, validatePaidIpn, handleIpn };