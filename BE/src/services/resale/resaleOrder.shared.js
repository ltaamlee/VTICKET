const crypto = require("node:crypto");
const prisma = require("../../config/prisma");
const {
    BadRequestException,
    ConflictException,
    NotFoundException,
} = require("../../exceptions");
const generateOrderCode = require("../../utils/orderCode");
const paymentService = require("../payment/payment.service");
const walletService = require("../wallet/wallet.service");

const OBJECT_ID = /^[a-f\d]{24}$/i;
const HOLD_MS = 15 * 60 * 1000;
// Phí sàn mặc định khi mua vé bán lại (%)
const DEFAULT_PLATFORM_FEE_RATE = 2;
const MAX_PRICE = 1_000_000_000;

function assertId(id, label = "ID") {
    if (typeof id !== "string" || !OBJECT_ID.test(id)) {
        throw new BadRequestException(`${label} không hợp lệ`);
    }
}

/**
 * Lấy tỷ lệ phí sàn đang cấu hình trong SystemSetting (payment.platformFeeRate).
 */
async function getPlatformFeeRate() {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: "payment" },
        });
        const rate = Number(setting?.value?.platformFeeRate);
        if (Number.isFinite(rate) && rate >= 0 && rate <= 100) {
            return rate;
        }
    } catch {
        // Bỏ qua, dùng giá trị mặc định
    }
    return DEFAULT_PLATFORM_FEE_RATE;
}

/**
 * Chi tiết vé công khai (không có mã vé / qrToken) cho sàn bán lại.
 */
const publicTicketDetails = {
    select: {
        id: true,
        status: true,
        event: {
            select: {
                id: true,
                name: true,
                thumbnailUrl: true,
                location: true,
                startAt: true,
                endAt: true,
                status: true,
            },
        },
        ticketType: {
            select: {
                id: true,
                name: true,
                price: true,
                session: {
                    select: {
                        id: true,
                        startAt: true,
                        endAt: true,
                    },
                },
            },
        },
        seat: {
            select: {
                rowLabel: true,
                seatNumber: true,
                zone: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
            },
        },
    },
};

/**
 * Chi tiết vé cho chủ vé / người mua (có mã vé + qrToken).
 */
const ticketDetails = {
    select: {
        id: true,
        ticketCode: true,
        qrToken: true,
        status: true,
        event: {
            select: {
                id: true,
                name: true,
                thumbnailUrl: true,
                location: true,
                startAt: true,
                endAt: true,
                status: true,
            },
        },
        ticketType: {
            select: {
                id: true,
                name: true,
                price: true,
                session: {
                    select: {
                        id: true,
                        startAt: true,
                        endAt: true,
                    },
                },
            },
        },
        seat: {
            select: {
                rowLabel: true,
                seatNumber: true,
                zone: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
            },
        },
    },
};

module.exports = {
    OBJECT_ID,
    HOLD_MS,
    DEFAULT_PLATFORM_FEE_RATE,
    MAX_PRICE,
    assertId,
    getPlatformFeeRate,
    publicTicketDetails,
    ticketDetails,
    crypto,
    prisma,
    generateOrderCode,
    paymentService,
    walletService,
    BadRequestException,
    ConflictException,
    NotFoundException,
};
