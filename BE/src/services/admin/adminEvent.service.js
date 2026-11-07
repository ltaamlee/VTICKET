const prisma = require("../../config/prisma");

const notDraft = {
    status: {
        not: "DRAFT",
    },
};

class AdminEventService {

    createError(message, statusCode = 400) {
        const error = new Error(message);
        error.statusCode = statusCode;
        throw error;
    }

    async getEventStats() {
        const [
            totalEvents,
            draftEvents,
            pendingEvents,
            approvedEvents,
            rejectedEvents,
            suspendedEvents,
            cancelledEvents,
            completedEvents,
        ] = await Promise.all([
            prisma.event.count(),
            prisma.event.count({ where: { status: "DRAFT" } }),
            prisma.event.count({ where: { status: "PENDING" } }),
            // Đã duyệt = APPROVED (sự kiện được công khai cho người dùng).
            prisma.event.count({ where: { status: "APPROVED" } }),
            prisma.event.count({ where: { status: "REJECTED" } }),
            prisma.event.count({ where: { status: "SUSPENDED" } }),
            prisma.event.count({ where: { status: "CANCELLED" } }),
            prisma.event.count({ where: { status: "COMPLETED" } }),
        ]);

        return {
            totalEvents,
            draftEvents,
            pendingEvents,
            approvedEvents,
            rejectedEvents,
            suspendedEvents,
            cancelledEvents,
            completedEvents,
        };
    }

    // ==========================================
    // GET EVENTS
    // ==========================================

    async getEvents({
        page = 1,
        keyword = "",
        status = "",
        categoryId = "",
    } = {}) {
        const currentPage = Math.max(1, Number(page) || 1);
        const pageSize = 10;
        const skip = (currentPage - 1) * pageSize;

        const searchKeyword =
            typeof keyword === "string" ? keyword.trim() : "";

        const searchStatus =
            typeof status === "string"
                ? status.trim().toUpperCase()
                : "";

        const where = { ...notDraft };

        if (searchKeyword) {
            where.OR = [
                {
                    name: {
                        contains: searchKeyword,
                        mode: "insensitive",
                    },
                },
                {
                    location: {
                        contains: searchKeyword,
                        mode: "insensitive",
                    },
                },
                {
                    organizer: {
                        is: {
                            email: {
                                contains: searchKeyword,
                                mode: "insensitive",
                            },
                        },
                    },
                },
            ];
        }

        if (searchStatus) {
            const validStatuses = [
                "PENDING",
                "APPROVED",
                "REJECTED",
                "CANCELLED",
                "COMPLETED",
                "SUSPENDED",
            ];

            if (!validStatuses.includes(searchStatus)) {
                this.createError("Trạng thái sự kiện không hợp lệ");
            }

            where.status = searchStatus;
        }

        if (categoryId) {
            if (!/^[a-fA-F0-9]{24}$/.test(categoryId)) {
                this.createError("ID danh mục không hợp lệ");
            }

            where.categoryId = categoryId;
        }

        const [events, totalEvents] = await Promise.all([
            prisma.event.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    organizer: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            profile: {
                                select: {
                                    fullName: true,
                                    avatar: true,
                                },
                            },
                            organizerProfile: {
                                select: {
                                    organizationName: true,
                                    logo: true,
                                    isVerified: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            posts: true,
                        },
                    },
                },
            }),

            prisma.event.count({ where }),
        ]);

        return {
            events: events.map((event) => ({
                id: event.id,
                name: event.name,
                description: event.description,
                thumbnailUrl: event.thumbnailUrl,
                bannerUrl: event.bannerUrl,
                location: event.location,
                status: event.status,
                startAt: event.startAt,
                endAt: event.endAt,
                saleStartAt: event.saleStartAt,
                saleEndAt: event.saleEndAt,
                reviewedAt: event.reviewedAt,
                rejectReason: event.rejectReason,
                category: event.category,
                organizer: event.organizer,
                seatMapId: event.seatMapId,
                seatMap: event.seatMap,
                postCount: event._count.posts,
                createdAt: event.createdAt,
                updatedAt: event.updatedAt,
            })),

            pagination: {
                currentPage,
                pageSize,
                totalEvents,
                totalPages: Math.ceil(totalEvents / pageSize),
            },
        };
    }

    async getEventDetail({ eventId }) {
        await this.findEvent(eventId);

        const event = await prisma.event.findUnique({
            where: {
                id: eventId,
            },
            include: {
                category: true,

                organizer: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        status: true,
                        profile: true,
                        organizerProfile: true,
                    },
                },

                seatMap: {
                    include: {
                        // Cần đủ thông tin để Admin vẽ lại sơ đồ
                        // (hình dạng, toạ độ, xoay, lật gương, lỗ...).
                        zones: {
                            orderBy: [
                                { zIndex: "asc" },
                                { name: "asc" },
                            ],
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                color: true,
                                type: true,
                                shape: true,
                                capacity: true,
                                price: true,
                                rowCount: true,
                                seatPerRow: true,
                                posX: true,
                                posY: true,
                                width: true,
                                height: true,
                                rotation: true,
                                level: true,
                                zIndex: true,
                                points: true,
                                holes: true,
                                flipX: true,
                                flipY: true,
                                removedSeats: true,
                                blockedSeats: true,
                                seatNumbering: true,
                                seats: {
                                    select: {
                                        id: true,
                                        rowLabel: true,
                                        seatNumber: true,
                                        status: true,
                                        order: true,
                                    },
                                },
                            },
                        },
                        _count: {
                            select: {
                                zones: true,
                            },
                        },
                    },
                },

                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
        });

        return {
            ...event,

            postCount: event._count.posts,
        };
    }

    /**
     * Lấy chi tiết sơ đồ ghế (kèm khu vực) cho Admin.
     *
     * Admin không phải chủ sơ đồ nên không dùng được route của Organizer.
     */
    async getSeatMapDetail({ seatMapId }) {
        if (
            typeof seatMapId !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(seatMapId)
        ) {
            this.createError("ID sơ đồ ghế không hợp lệ");
        }

        const seatMap = await prisma.seatMap.findUnique({
            where: {
                id: seatMapId,
            },
            include: {
                zones: {
                    orderBy: [
                        { zIndex: "asc" },
                        { name: "asc" },
                    ],
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        color: true,
                        type: true,
                        shape: true,
                        capacity: true,
                        price: true,
                        rowCount: true,
                        seatPerRow: true,
                        posX: true,
                        posY: true,
                        width: true,
                        height: true,
                        rotation: true,
                        level: true,
                        zIndex: true,
                        points: true,
                        holes: true,
                        flipX: true,
                        flipY: true,
                        removedSeats: true,
                        blockedSeats: true,
                        seatNumbering: true,
                        seats: {
                            select: {
                                id: true,
                                rowLabel: true,
                                seatNumber: true,
                                status: true,
                                order: true,
                            },
                        },
                    },
                },
                events: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        if (!seatMap) {
            this.createError("Không tìm thấy sơ đồ ghế", 404);
        }

        return {
            ...seatMap,
            event: seatMap.events[0] || null,
        };
    }

    async findEvent(eventId) {
        if (
            typeof eventId !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(eventId)
        ) {
            this.createError("ID sự kiện không hợp lệ");
        }

        const event = await prisma.event.findUnique({
            where: {
                id: eventId,
            },
        });

        if (!event) {
            this.createError("Không tìm thấy sự kiện", 404);
        }

        return event;
    }



    // ==========================================
    // APPROVE EVENT
    // ==========================================

    /**
     * Đồng bộ trạng thái sơ đồ ghế theo trạng thái sự kiện.
     *
     * - Duyệt (APPROVED) -> sơ đồ READY (dùng để bán vé).
     * - Từ chối / huỷ / khóa -> sơ đồ về DRAFT (để BTC chỉnh lại).
     *
     * Sơ đồ đang ARCHIVED thì giữ nguyên, không tự động mở lại.
     */
    async syncSeatMapStatus({ seatMapId, status }) {
        if (!seatMapId) return;

        const seatMap = await prisma.seatMap.findUnique({
            where: { id: seatMapId },
            select: { id: true, status: true },
        });

        if (!seatMap) return;

        // Đã lưu trữ thì giữ nguyên trạng thái.
        if (seatMap.status === "ARCHIVED") return;

        const nextStatus = status === "APPROVED" ? "READY" : "DRAFT";

        if (seatMap.status === nextStatus) return;

        await prisma.seatMap.update({
            where: { id: seatMapId },
            data: { status: nextStatus },
        });
    }

    async approveEvent({ eventId }) {
        const event = await this.findEvent(eventId);

        if (event.status !== "PENDING") {
            this.createError(
                "Chỉ có thể duyệt sự kiện đang chờ duyệt"
            );
        }

        const updated = await prisma.event.update({
            where: {
                id: eventId,
            },
            data: {
                status: "APPROVED",
                reviewedAt: new Date(),
                rejectReason: null,
            },
        });

        // Sự kiện được duyệt -> sơ đồ ghế cũng sẵn sàng bán vé.
        await this.syncSeatMapStatus({
            seatMapId: event.seatMapId,
            status: "APPROVED",
        });

        return updated;
    }

    // ==========================================
    // REJECT EVENT
    // ==========================================

    async rejectEvent({ eventId, reason }) {
        const event = await this.findEvent(eventId);

        if (event.status !== "PENDING") {
            this.createError(
                "Chỉ có thể từ chối sự kiện đang chờ duyệt"
            );
        }

        if (typeof reason !== "string" || !reason.trim()) {
            this.createError("Vui lòng nhập lý do từ chối");
        }

        const updated = await prisma.event.update({
            where: {
                id: eventId,
            },
            data: {
                status: "REJECTED",
                reviewedAt: new Date(),
                rejectReason: reason.trim(),
            },
        });

        // Bị từ chối -> sơ đồ về bản nháp để BTC chỉnh lại.
        await this.syncSeatMapStatus({
            seatMapId: event.seatMapId,
            status: "REJECTED",
        });

        return updated;
    }

    // ==========================================
    // SUSPEND EVENT
    // ==========================================

    async suspendEvent({ eventId }) {
        const event = await this.findEvent(eventId);

        if (!["APPROVED"].includes(event.status)) {
            this.createError(
                "Chỉ có thể khóa sự kiện đã được duyệt"
            );
        }

        const updated = await prisma.event.update({
            where: {
                id: eventId,
            },
            data: {
                status: "SUSPENDED",
            },
        });

        // Khoá sự kiện -> sơ đồ về bản nháp (không bán vé nữa).
        await this.syncSeatMapStatus({
            seatMapId: event.seatMapId,
            status: "SUSPENDED",
        });

        return updated;
    }

    // ==========================================
    // RESTORE EVENT
    // ==========================================

    async restoreEvent({ eventId }) {
        const event = await this.findEvent(eventId);

        if (event.status !== "SUSPENDED") {
            this.createError(
                "Chỉ có thể mở khóa sự kiện đang bị khóa"
            );
        }

        const updated = await prisma.event.update({
            where: {
                id: eventId,
            },
            data: {
                status: "APPROVED",
            },
        });

        // Mở khoá -> sơ đồ sẵn sàng trở lại.
        await this.syncSeatMapStatus({
            seatMapId: event.seatMapId,
            status: "APPROVED",
        });

        return updated;
    }

    // ==========================================
    // CANCEL EVENT
    // ==========================================

    async cancelEvent({ eventId }) {
        const event = await this.findEvent(eventId);

        if (
            event.status === "CANCELLED" ||
            event.status === "COMPLETED"
        ) {
            this.createError(
                "Không thể hủy sự kiện đã bị hủy hoặc đã hoàn thành"
            );
        }

        const updated = await prisma.event.update({
            where: {
                id: eventId,
            },
            data: {
                status: "CANCELLED",
            },
        });

        // Huỷ sự kiện -> sơ đồ về bản nháp.
        await this.syncSeatMapStatus({
            seatMapId: event.seatMapId,
            status: "CANCELLED",
        });

        return updated;
    }
}

module.exports = new AdminEventService();