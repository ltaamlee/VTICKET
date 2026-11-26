const prisma = require("../../config/prisma");
const { AppException } = require("../../exceptions");

async function ensurePaymentIndexes() {
    for (const [collection, field] of [["seatAllocations", "key"], ["sepayNotifications", "transactionId"], ["ticketEmailDeliveries", "orderId"], ["bookingReservations", "reference"], ["orders", "orderCode"]]) {
        let result;
        try {
            result = await prisma.$runCommandRaw({ listIndexes: collection });
        } catch (error) {
            console.error("Không thể kiểm tra chỉ mục thanh toán:", error.code || error.name);
            throw new AppException("Không thể kiểm tra chỉ mục thanh toán; vui lòng kiểm tra cơ sở dữ liệu", 503);
        }
        const indexes = result?.cursor?.firstBatch;
        if (!Array.isArray(indexes) || !indexes.some((index) =>
            index.unique === true && Object.keys(index.key || {}).length === 1 && index.key[field] === 1
        )) {
            throw new AppException("Thiếu chỉ mục thanh toán bắt buộc; cần đồng bộ Prisma schema", 503);
        }
    }
}

module.exports = ensurePaymentIndexes;
