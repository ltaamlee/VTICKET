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
            publishedEvents,
            rejectedEvents,
            suspendedEvents,
            cancelledEvents,
            completedEvents,
        ] = await Promise.all([
            prisma.event.count(),
            prisma.event.count({ where: { status: "DRAFT" } }),
            prisma.event.count({ where: { status: "PENDING" } }),
            prisma.event.count({ where: { status: "APPROVED" } }),
            prisma.event.count({ where: { status: "PUBLISHED" } }),
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
            publishedEvents,
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
                "PUBLISHED",
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
                            eventSessions: true,
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
                sessionCount: event._count.eventSessions,
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

                eventSessions: {
                    orderBy: {
                        startAt: "asc",
                    },
                    include: {
                        seatMap: {
                            include: {
                                _count: {
                                    select: {
                                        zones: true,
                                    },
                                },
                            },
                        },
                        _count: {
                            select: {
                                ticketTypes: true,
                                tickets: true,
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

            eventSessions: event.eventSessions.map((session) => ({
                ...session,
                ticketTypeCount: session._count.ticketTypes,
                ticketCount: session._count.tickets,
                zoneCount: session.seatMap?._count.zones || 0,
            })),

            postCount: event._count.posts,
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

    async approveEvent({ eventId }) {
        const event = await this.findEvent(eventId);

        if (event.status !== "PENDING") {
            this.createError(
                "Chỉ có thể duyệt sự kiện đang chờ duyệt"
            );
        }

        return prisma.event.update({
            where: {
                id: eventId,
            },
            data: {
                status: "APPROVED",
                reviewedAt: new Date(),
                rejectReason: null,
            },
        });
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

        return prisma.event.update({
            where: {
                id: eventId,
            },
            data: {
                status: "REJECTED",
                reviewedAt: new Date(),
                rejectReason: reason.trim(),
            },
        });
    }

    // ==========================================
    // SUSPEND EVENT
    // ==========================================

    async suspendEvent({ eventId }) {
        const event = await this.findEvent(eventId);

        if (!["APPROVED", "PUBLISHED"].includes(event.status)) {
            this.createError(
                "Chỉ có thể khóa sự kiện đã được duyệt hoặc công khai"
            );
        }

        return prisma.event.update({
            where: {
                id: eventId,
            },
            data: {
                status: "SUSPENDED",
            },
        });
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

        return prisma.event.update({
            where: {
                id: eventId,
            },
            data: {
                status: "APPROVED",
            },
        });
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

        return prisma.event.update({
            where: {
                id: eventId,
            },
            data: {
                status: "CANCELLED",
            },
        });
    }
}

module.exports = new AdminEventService();