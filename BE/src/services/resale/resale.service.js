
const prisma = require("../../config/prisma");
const EventMapper = require("../../mappers/event.mapper");
const {
    BadRequestException,
    ConflictException,
    NotFoundException,
} = require("../../exceptions");
const BaseService = require("../public/base.service");

const OBJECT_ID = /^[a-f\d]{24}$/i;
const MAX_PRICE = 1_000_000_000;

class ResaleService extends BaseService{
    constructor(prismaClient = prisma) {
        super(prismaClient);
        this.prisma = prismaClient;
    }

    assertId(id, label = "ID") {
        if (typeof id !== "string" || !OBJECT_ID.test(id)) {
            throw new BadRequestException(`${label} không hợp lệ`);
        }
    }

    pagination(page, pageSize) {
        const currentPage = Math.max(1, Math.floor(Number(page) || 1));
        const size = Math.min(100, Math.max(1, Math.floor(Number(pageSize) || 20)));

        return {
            currentPage,
            pageSize: size,
            skip: (currentPage - 1) * size,
        };
    }

    paginationResult(pageInfo, total) {
        return {
            currentPage: pageInfo.currentPage,
            pageSize: pageInfo.pageSize,
            total,
            totalPages: Math.ceil(total / pageInfo.pageSize),
        };
    }

    /**
     * Chi tiết vé dùng cho người MUA và CHỦ VÉ (có mã vé / qrToken).
     */
    get ticketDetails() {
        return {
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
    }

    /**
     * Chi tiết vé cho XEM CÔNG KHAI trên sàn bán lại.
     *
     * KHÔNG trả về `ticketCode` / `qrToken` vì đó là bí mật của vé:
     * người lạ có thể dùng mã đó để check-in hoặc đánh cắp vé.
     * Mã vé chỉ được hiển thị với chủ vé và người đã mua thành công.
     */
    get publicTicketDetails() {
        return {
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
    }

    // ==================== PUBLIC LISTINGS ====================

    /**
     * Lấy danh sách SỰ KIỆN đang có vé bán lại (dùng cho trang sàn vé bán lại).
     *
     * Mỗi sự kiện được bổ sung:
     * - `resaleCount`   : số vé đang bán lại
     * - `resaleMinPrice`: giá bán lại thấp nhất
     * - `resaleMaxPrice`: giá bán lại cao nhất
     */
    async listResaleEvents({ page, pageSize, keyword, categoryId, sortBy, sortOrder }) {
        const pageInfo = this.pagination(page, pageSize);
        const search = typeof keyword === "string" ? keyword.trim() : "";

        const where = {
            status: "APPROVED",
            endAt: { gte: new Date() },
            tickets: {
                some: {
                    status: "RESERVED",
                    checkInAt: undefined,
                    resale: { status: "AVAILABLE" },
                },
            },
            ...(search
                ? {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                }
                : {}),
            ...(categoryId
                ? {
                    categoryId,
                }
                : {}),
        };

        const allowedSort = ["startAt", "name", "createdAt"];
        const orderByField = allowedSort.includes(sortBy) ? sortBy : "startAt";
        const orderByDirection = sortOrder === "desc" ? "desc" : "asc";

        const [events, total] = await Promise.all([
            this.prisma.event.findMany({
                where,
                skip: pageInfo.skip,
                take: pageInfo.pageSize,
                orderBy: { [orderByField]: orderByDirection },
                include: {
                    category: {
                        select: { id: true, name: true, slug: true },
                    },
                    organizer: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            organizerProfile: {
                                select: {
                                    organizationName: true,
                                    logo: true,
                                    isVerified: true,
                                },
                            },
                        },
                    },
                    tickets: {
                        where: {
                            status: "RESERVED",
                            checkInAt: undefined,
                            resale: { status: "AVAILABLE" },
                        },
                        select: {
                            id: true,
                            resale: {
                                select: {
                                    id: true,
                                    price: true,
                                    createdAt: true,
                                },
                            },
                        },
                    },
                    ticketTypes: {
                        where: { status: "ACTIVE" },
                        select: {
                            id: true,
                            sessionId: true,
                            name: true,
                            price: true,
                            capacity: true,
                            soldQuantity: true,
                            status: true,
                            saleStartAt: true,
                            saleEndAt: true,
                        },
                    },
                },
            }),
            this.prisma.event.count({ where }),
        ]);

        const mapped = events.map((event) => {
            const resales = (event.tickets || [])
                .map((ticket) => ticket.resale)
                .filter(Boolean);
            const prices = resales
                .map((resale) => Number(resale.price))
                .filter((price) => Number.isFinite(price));

            const summary = EventMapper.toEventSummaryResponse(event);

            return {
                ...summary,
                resaleCount: resales.length,
                resaleMinPrice: prices.length ? Math.min(...prices) : null,
                resaleMaxPrice: prices.length ? Math.max(...prices) : null,
            };
        });

        return {
            events: mapped,
            pagination: this.paginationResult(pageInfo, total),
        };
    }

    // Lấy danh sách vé đang được bán lại
    async listListings({ page, pageSize, eventId, keyword }) {
        const pageInfo = this.pagination(page, pageSize);

        if (eventId) {
            this.assertId(eventId, "ID sự kiện");
        }

        const search = typeof keyword === "string" ? keyword.trim() : "";

        const where = {
            status: "AVAILABLE",
            ...(eventId || search
                ? {
                    ticket: {
                        ...(eventId ? { eventId } : {}),
                        ...(search
                            ? {
                                event: {
                                    name: {
                                        contains: search,
                                        mode: "insensitive",
                                    },
                                },
                            }
                            : {}),
                    },
                }
                : {}),
        };

        const [listings, total] = await Promise.all([
            this.prisma.reSale.findMany({
                where,
                skip: pageInfo.skip,
                take: pageInfo.pageSize,
                orderBy: { createdAt: "desc" },
                // Công khai: không trả mã vé / qrToken
                include: { ticket: this.publicTicketDetails },
            }),

            this.prisma.reSale.count({ where }),
        ]);

        return {
            listings,
            pagination: this.paginationResult(pageInfo, total),
        };
    }

    // Lấy chi tiết tin bán vé
    // @param userId - ID người xem (nếu đã đăng nhập). Chỉ chủ vé hoặc
    //                 người đã mua mới được thấy mã vé / qrToken.
    async getListing({ resaleId, userId }) {
        this.assertId(resaleId, "ID tin đăng");

        const listing = await this.prisma.reSale.findFirst({
            where: {
                id: resaleId,
                status: "AVAILABLE",
            },
            include: {
                ticket: this.publicTicketDetails,
            },
        });

        if (!listing) {
            throw new NotFoundException("Không tìm thấy tin bán vé");
        }

        // Chỉ chủ vé (người đang bán) được thấy mã vé của chính mình.
        // Người mua sẽ nhận mã vé sau khi giao dịch thành công.
        if (userId && listing.sellerId === userId) {
            const full = await this.prisma.reSale.findFirst({
                where: { id: resaleId },
                include: { ticket: this.ticketDetails },
            });

            if (full) {
                return full;
            }
        }

        return listing;
    }

    // ==================== SELLER ====================

    // Lấy vé có thể bán lại
    async listMyTickets({ userId, page, pageSize }) {
        this.assertId(userId, "ID người dùng");

        const pageInfo = this.pagination(page, pageSize);

        const where = {
            userId,
            status: "ISSUED",
            // Prisma + MongoDB: filter "checkInAt: null" chỉ match field ĐÃ TỒN TẠI
            // và bằng null. Field chưa từng được set sẽ bị bỏ qua -> dùng undefined.
            checkInAt: undefined,
            resale: null,
            event: {
                status: "APPROVED",
                endAt: { gt: new Date() },
            },
        };

        const [tickets, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                skip: pageInfo.skip,
                take: pageInfo.pageSize,
                orderBy: { issuedAt: "desc" },
                ...this.ticketDetails,
            }),

            this.prisma.ticket.count({ where }),
        ]);

        return {
            tickets,
            pagination: this.paginationResult(pageInfo, total),
        };
    }

    // Lấy toàn bộ vé đang sở hữu kèm trạng thái bán lại (dùng cho trang "Vé của tôi")
    async listMyOwnedTickets({ userId, page, pageSize }) {
        this.assertId(userId, "ID người dùng");

        const pageInfo = this.pagination(page, pageSize);

        const where = {
            userId,
            status: { in: ["ISSUED", "RESERVED", "CHECKED_IN"] },
        };

        const [tickets, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                skip: pageInfo.skip,
                take: pageInfo.pageSize,
                orderBy: { issuedAt: "desc" },
                select: {
                    id: true,
                    ticketCode: true,
                    qrToken: true,
                    status: true,
                    issuedAt: true,
                    checkInAt: true,
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
                    resale: {
                        select: {
                            id: true,
                            price: true,
                            status: true,
                            buyerId: true,
                            createdAt: true,
                        },
                    },
                },
            }),

            this.prisma.ticket.count({ where }),
        ]);

        const now = new Date();

        // Gắn cờ bán lại được / không, để FE không phải tự suy luận
        const decorated = tickets.map((ticket) => {
            const event = ticket.event || {};
            const resale = ticket.resale;

            const canResell =
                !resale &&
                ticket.status === "ISSUED" &&
                !ticket.checkInAt &&
                event.status === "APPROVED" &&
                event.endAt > now;

            return {
                ...ticket,
                canResell,
                isOnResale: Boolean(resale && resale.status === "AVAILABLE"),
                isResaleSold: Boolean(resale && resale.status === "SOLD"),
            };
        });

        return {
            tickets: decorated,
            pagination: this.paginationResult(pageInfo, total),
        };
    }

    // Lấy danh sách tin bán của người dùng
    async listMine({ userId, page, pageSize }) {
        this.assertId(userId, "ID người dùng");

        const pageInfo = this.pagination(page, pageSize);

        const where = { sellerId: userId };

        const [listings, total] = await Promise.all([
            this.prisma.reSale.findMany({
                where,
                skip: pageInfo.skip,
                take: pageInfo.pageSize,
                orderBy: { updatedAt: "desc" },
                include: { ticket: this.ticketDetails },
            }),

            this.prisma.reSale.count({ where }),
        ]);

        return {
            listings,
            pagination: this.paginationResult(pageInfo, total),
        };
    }

    // Đăng bán vé
    async createListing({ userId, ticketId, price }) {
        this.assertId(userId, "ID người dùng");
        this.assertId(ticketId, "ID vé");

        if (
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price < 0 ||
            price > MAX_PRICE
        ) {
            throw new BadRequestException(
                `Giá bán phải từ 0 đến ${MAX_PRICE.toLocaleString("vi-VN")} VND`
            );
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                const ticket = await tx.ticket.findFirst({
                    where: {
                        id: ticketId,
                        userId,
                    },
                    include: {
                        event: true,
                        ticketType: true,
                        resale: true,
                    },
                });

                if (!ticket) {
                    throw new NotFoundException(
                        "Không tìm thấy vé thuộc tài khoản của bạn"
                    );
                }

                const now = new Date();

                if (
                    ticket.status !== "ISSUED" ||
                    ticket.checkInAt ||
                    ticket.resale ||
                    ticket.event.status !== "APPROVED" ||
                    ticket.event.endAt <= now
                ) {
                    throw new ConflictException(
                        "Vé này không đủ điều kiện để bán lại"
                    );
                }

                const updated = await tx.ticket.updateMany({
                    where: {
                        id: ticketId,
                        userId,
                        status: "ISSUED",
                        // undefined: bỏ qua điều kiện check-in (xem giải thích ở listMyTickets)
                        checkInAt: undefined,
                    },
                    data: {
                        status: "RESERVED",
                    },
                });

                if (!updated.count) {
                    throw new ConflictException(
                        "Vé vừa được cập nhật, vui lòng thử lại"
                    );
                }

                return tx.reSale.create({
                    data: {
                        ticketId,
                        sellerId: userId,
                        price,
                    },
                    include: {
                        ticket: this.ticketDetails,
                    },
                });
            });
        } catch (error) {
            if (error?.code === "P2002" || error?.code === "P2034") {
                throw new ConflictException(
                    "Vé đã được đăng bán hoặc vừa thay đổi, vui lòng tải lại"
                );
            }

            throw error;
        }
    }

    // Hủy tin bán vé
    async cancelListing({ userId, resaleId }) {
        this.assertId(userId, "ID người dùng");
        this.assertId(resaleId, "ID tin đăng");

        try {
            return await this.prisma.$transaction(async (tx) => {
                const listing = await tx.reSale.findFirst({
                    where: {
                        id: resaleId,
                        sellerId: userId,
                    },
                });

                if (!listing) {
                    throw new NotFoundException(
                        "Không tìm thấy tin bán vé của bạn"
                    );
                }

                if (listing.status !== "AVAILABLE") {
                    throw new ConflictException(
                        "Tin bán không còn khả dụng để hủy"
                    );
                }

                const changed = await tx.reSale.updateMany({
                    where: {
                        id: resaleId,
                        sellerId: userId,
                        status: "AVAILABLE",
                    },
                    data: {
                        status: "CANCELLED",
                    },
                });

                if (!changed.count) {
                    throw new ConflictException(
                        "Tin bán vừa được cập nhật, vui lòng thử lại"
                    );
                }

                const restored = await tx.ticket.updateMany({
                    where: {
                        id: listing.ticketId,
                        userId,
                        status: "RESERVED",
                        // undefined: bỏ qua điều kiện check-in (xem giải thích ở listMyTickets)
                        checkInAt: undefined,
                    },
                    data: {
                        status: "ISSUED",
                    },
                });

                if (!restored.count) {
                    throw new ConflictException(
                        "Không thể trả vé về tài khoản người bán"
                    );
                }

                return {
                    id: resaleId,
                    status: "CANCELLED",
                };
            });
        } catch (error) {
            if (error?.code === "P2034") {
                throw new ConflictException(
                    "Tin bán vừa được cập nhật, vui lòng thử lại"
                );
            }

            throw error;
        }
    }

    // ==================== BUYER ====================

    /**
     * Mua lại vé - tạo đơn hàng thanh toán.
     *
     * Vé KHÔNG được chuyển ngay. Vé được giữ (RESERVED) cho người mua trong
     * thời gian thanh toán. Chỉ khi thanh toán thành công (qua cổng SePay
     * hoặc ví điện tử) thì vé mới được chuyển sang người mua kèm mã vé
     * và QR MỚI.
     */
    async purchaseListing({ userId, resaleId, method }) {
        const { createResaleOrder } = require("./resaleOrder.service");
        return createResaleOrder({ userId, resaleId, method });
    }

    /**
     * Lấy chi tiết đơn mua vé bán lại.
     */
    async getPurchaseOrder({ userId, orderId }) {
        const { getResaleOrder } = require("./resaleOrder.pay");
        return getResaleOrder({ userId, orderId });
    }

    /**
     * Khởi tạo thanh toán đơn mua vé bán lại qua cổng SePay.
     */
    async checkoutPurchaseOrder({ userId, orderId }) {
        const { checkoutResaleOrder } = require("./resaleOrder.pay");
        return checkoutResaleOrder({ userId, orderId });
    }

    /**
     * Thanh toán đơn mua vé bán lại bằng số dư ví điện tử.
     */
    async payPurchaseOrderWithWallet({ userId, orderId }) {
        const { payWithWallet } = require("./resaleOrder.pay");
        return payWithWallet({ userId, orderId });
    }

    /**
     * Hủy đơn mua vé bán lại.
     */
    async cancelPurchaseOrder({ userId, orderId }) {
        const { cancelResaleOrder } = require("./resaleOrder.cancel");
        return cancelResaleOrder({ userId, orderId });
    }

    // Lấy danh sách vé đã mua lại
    async listPurchases({ userId, page, pageSize }) {
        this.assertId(userId, "ID người dùng");

        const pageInfo = this.pagination(page, pageSize);

        const where = {
            buyerId: userId,
            status: "SOLD",
        };

        const [listings, total] = await Promise.all([
            this.prisma.reSale.findMany({
                where,
                skip: pageInfo.skip,
                take: pageInfo.pageSize,
                orderBy: { updatedAt: "desc" },
                include: {
                    ticket: this.ticketDetails,
                },
            }),

            this.prisma.reSale.count({ where }),
        ]);

        return {
            listings,
            pagination: this.paginationResult(pageInfo, total),
        };
    }
}

module.exports = new ResaleService();