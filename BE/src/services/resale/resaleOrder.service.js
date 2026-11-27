const {
    HOLD_MS,
    assertId,
    getPlatformFeeRate,
    crypto,
    prisma,
    generateOrderCode,
    paymentService,
    walletService,
    BadRequestException,
    ConflictException,
    NotFoundException,
} = require("./resaleOrder.shared");

/**
 * Tạo đơn mua vé bán lại (chưa thanh toán).
 *
 * Vé được "giữ" cho người mua trong thời gian thanh toán:
 * - listing.status -> RESERVED
 * - tạo ResaleOrder với status PENDING_PAYMENT
 */
async function createResaleOrder({ userId, resaleId, method }) {
    assertId(userId, "ID người dùng");
    assertId(resaleId, "ID tin đăng");

    const paymentMethod = method === "WALLET" ? "WALLET" : "SEPAY";

    // Kiểm tra ví nếu chọn thanh toán bằng ví
    if (paymentMethod === "WALLET") {
        const walletSettings = await walletService.getWalletSettings();

        if (!walletSettings.enabled || !walletSettings.allowWalletPayment) {
            throw new BadRequestException(
                "Thanh toán bằng ví điện tử hiện không khả dụng. Vui lòng chọn cổng thanh toán khác."
            );
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) {
            throw new BadRequestException(
                "Bạn chưa có ví điện tử. Vui lòng nạp tiền hoặc chọn cổng thanh toán khác."
            );
        }
    }

    const listing = await prisma.reSale.findUnique({
        where: { id: resaleId },
        include: { ticket: { include: { event: true } } },
    });

    if (!listing || listing.status !== "AVAILABLE") {
        throw new NotFoundException("Tin bán không còn khả dụng");
    }

    if (listing.sellerId === userId) {
        throw new ConflictException("Bạn không thể mua vé do mình đăng bán");
    }

    const now = new Date();

    if (
        listing.ticket.status !== "RESERVED" ||
        listing.ticket.userId !== listing.sellerId ||
        listing.ticket.checkInAt ||
        listing.ticket.event.status !== "APPROVED" ||
        listing.ticket.event.endAt <= now
    ) {
        throw new ConflictException("Vé trong tin bán không còn đủ điều kiện giao dịch");
    }

    const feeRate = await getPlatformFeeRate();
    const totalAmount = Number(listing.price);
    const platformFee = Math.round(totalAmount * (feeRate / 100));
    const sellerAmount = Math.max(0, totalAmount - platformFee);
    const expiresAt = new Date(now.getTime() + HOLD_MS);

    return prisma.$transaction(async (tx) => {
        // Giữ vé cho người mua
        const reserved = await tx.reSale.updateMany({
            where: { id: resaleId, status: "AVAILABLE" },
            data: { status: "RESERVED" },
        });

        if (!reserved.count) {
            throw new ConflictException("Vé vừa được người khác mua");
        }

        return tx.resaleOrder.create({
            data: {
                orderCode: generateOrderCode(now),
                userId,
                resaleId,
                totalAmount,
                platformFee,
                sellerAmount,
                method: paymentMethod,
                status: "PENDING_PAYMENT",
                expiresAt,
            },
        });
    }).catch((error) => {
        if (error?.code === "P2034") {
            throw new ConflictException("Vé vừa được người khác xử lý, vui lòng thử lại");
        }
        throw error;
    });
}

module.exports = { createResaleOrder };

