const prisma = require("../../config/prisma");

const BaseService = require("../public/base.service");

const TICKET_STATUSES = [
    "AVAILABLE",
    "RESERVED",
    "ISSUED",
    "CHECKED_IN",
    "CANCELLED",
    "REFUNDED",
    "EXPIRED",
];

class OrganizerTicketService extends BaseService {
    validateOrganizer(organizerId) {
        if (!organizerId) {
            this.throwError("Không xác định được tài khoản Ban tổ chức", 401);
        }
    }

    validateId(id, message) {
        if (typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id)) {
            this.throwError(message);
        }
    }

    async findOwnedEvent({ eventId, organizerId }) {
        this.validateOrganizer(organizerId);
        this.validateId(eventId, "ID sự kiện không hợp lệ");

        const event = await prisma.event.findFirst({
            where: { id: eventId, organizerId },
            select: { id: true, name: true, status: true },
        });

        if (!event) {
            this.throwError("Không tìm thấy sự kiện", 404);
        }

        return event;
    }

    async getTicketTypes({ eventId, organizerId }) {
        await this.findOwnedEvent({ eventId, organizerId });

        const ticketTypes = await prisma.ticketType.findMany({
            where: { eventId },
            orderBy: { createdAt: "asc" },
            include: {
                zone: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        color: true,
                        type: true,
                    },
                },
                _count: {
                    select: {
                        tickets: true,
                        orderItems: true,
                    },
                },
            },
        });

        return ticketTypes.map((ticketType) => ({
            ...ticketType,
            remainingQuantity: Math.max(
                0,
                ticketType.capacity - ticketType.soldQuantity
            ),
        }));
    }

    async getEventTicketStats({ eventId, organizerId }) {
        await this.findOwnedEvent({ eventId, organizerId });

        const [capacity, issued, checkedIn, legacyReserved, reservations, cancelled] = await Promise.all([
            prisma.ticketType.aggregate({
                where: { eventId },
                _sum: { capacity: true },
            }),
            prisma.ticket.count({ where: { eventId, status: "ISSUED" } }),
            prisma.ticket.count({ where: { eventId, status: "CHECKED_IN" } }),
            prisma.ticket.count({ where: { eventId, status: "RESERVED" } }),
            prisma.bookingReservation.findMany({
                where: { eventId, status: "PENDING_PAYMENT" },
                select: { items: true },
            }),
            prisma.ticket.count({ where: { eventId, status: "CANCELLED" } }),
        ]);

        const total = capacity._sum.capacity || 0;
        const reserved = legacyReserved + reservations.reduce(
            (sum, reservation) => sum + reservation.items.reduce((count, item) => count + item.quantity, 0), 0
        );
        const sold = issued + checkedIn;

        return {
            total,
            available: Math.max(0, total - sold - reserved),
            reserved,
            sold,
            issued,
            checkedIn,
            cancelled,
        };
    }

    async getEventTickets({
        eventId,
        organizerId,
        page = 1,
        pageSize = 20,
        keyword = "",
        status = "",
        sessionId = "",
    }) {
        await this.findOwnedEvent({ eventId, organizerId });

        const currentPage = Math.max(1, Math.floor(Number(page) || 1));
        const currentPageSize = Math.min(
            100,
            Math.max(1, Math.floor(Number(pageSize) || 20))
        );
        const searchKeyword =
            typeof keyword === "string" ? keyword.trim() : "";
        const where = { eventId };

        if (status) {
            if (!TICKET_STATUSES.includes(status)) {
                this.throwError("Trạng thái vé không hợp lệ");
            }

            where.status = status;
        }

        if (sessionId) {
            this.validateId(sessionId, "ID suất diễn không hợp lệ");
            where.ticketType = { sessionId };
        }

        if (searchKeyword) {
            where.ticketCode = {
                contains: searchKeyword,
                mode: "insensitive",
            };
        }

        const [rawTickets, totalTickets] = await Promise.all([
            prisma.ticket.findMany({
                where,
                skip: (currentPage - 1) * currentPageSize,
                take: currentPageSize,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    ticketCode: true,
                    status: true,
                    issuedAt: true,
                    checkInAt: true,
                    createdAt: true,
                    userId: true,
                    ticketType: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            sessionId: true,
                        },
                    },
                    seat: {
                        select: {
                            rowLabel: true,
                            seatNumber: true,
                            zone: {
                                select: { name: true, code: true },
                            },
                        },
                    },
                },
            }),
            prisma.ticket.count({ where }),
        ]);

        const userIds = [...new Set(rawTickets.map((ticket) => ticket.userId).filter(Boolean))];
        const users = userIds.length
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: {
                    id: true,
                    email: true,
                    profile: {
                        select: {
                            fullName: true,
                            phone: true,
                        },
                    },
                },
            })
            : [];
        const usersById = new Map(users.map((user) => [user.id, user]));
        const tickets = rawTickets.map(({ userId, ...ticket }) => ({
            ...ticket,
            user: usersById.get(userId) || null,
        }));

        return {
            tickets,
            pagination: {
                currentPage,
                pageSize: currentPageSize,
                totalTickets,
                totalPages: Math.ceil(totalTickets / currentPageSize),
            },
        };
    }

    async getTicketDetail({ ticketId, organizerId }) {
        this.validateOrganizer(organizerId);
        this.validateId(ticketId, "ID vé không hợp lệ");

        const rawTicket = await prisma.ticket.findFirst({
            where: {
                id: ticketId,
                event: { organizerId },
            },
            select: {
                id: true,
                ticketCode: true,
                status: true,
                issuedAt: true,
                checkInAt: true,
                createdAt: true,
                userId: true,
                event: {
                    select: {
                        id: true,
                        name: true,
                        startAt: true,
                        endAt: true,
                        location: true,
                    },
                },
                ticketType: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        sessionId: true,
                    },
                },
                seat: {
                    select: {
                        rowLabel: true,
                        seatNumber: true,
                        zone: {
                            select: { id: true, name: true, code: true },
                        },
                    },
                },
            },
        });

        if (!rawTicket) {
            this.throwError("Không tìm thấy vé", 404);
        }

        const user = rawTicket.userId
            ? await prisma.user.findUnique({
                where: { id: rawTicket.userId },
                select: {
                    id: true,
                    email: true,
                    profile: {
                        select: {
                            fullName: true,
                            phone: true,
                        },
                    },
                },
            })
            : null;
        const { userId, ...ticket } = rawTicket;

        return {
            ...ticket,
            user,
        };
    }

    async checkInTicket({ ticketId, organizerId, eventId, sessionId, qrToken }) {
        this.validateOrganizer(organizerId);
        if (ticketId) {
            this.validateId(ticketId, "ID vé không hợp lệ");
        } else {
            this.validateId(eventId, "ID sự kiện không hợp lệ");
            if (typeof qrToken !== "string" || !/^[a-f\d]{64}$/.test(qrToken)) {
                this.throwError("Mã QR không hợp lệ");
            }
        }
        if (sessionId === undefined) this.throwError("Vui lòng cung cấp suất diễn");
        if (sessionId !== null) this.validateId(sessionId, "ID suất diễn không hợp lệ");

        const ticket = await prisma.ticket.findFirst({
            where: {
                ...(ticketId ? { id: ticketId } : { qrToken, eventId }),
                event: { organizerId },
            },
            select: {
                id: true, eventId: true, ticketTypeId: true, status: true,
                ticketType: { select: { eventId: true, sessionId: true, session: { select: { eventId: true } } } },
            },
        });

        if (!ticket) {
            this.throwError("Không tìm thấy vé", 404);
        }

        if (!ticket.ticketType || ticket.ticketType.eventId !== ticket.eventId ||
            (ticket.ticketType.sessionId && ticket.ticketType.session?.eventId !== ticket.eventId) ||
            (ticket.ticketType.sessionId || null) !== sessionId) {
            this.throwError("Vé không thuộc suất diễn đã chọn", 409);
        }

        if (ticket.status !== "ISSUED") {
            this.throwError(
                ticket.status === "CHECKED_IN"
                    ? "Vé đã được check-in trước đó"
                    : "Chỉ vé đã phát hành mới được check-in",
                409
            );
        }

        const now = new Date();
        const result = await prisma.ticket.updateMany({
            where: {
                id: ticket.id,
                eventId: ticket.eventId,
                ticketTypeId: ticket.ticketTypeId,
                status: "ISSUED",
            },
            data: {
                status: "CHECKED_IN",
                checkInAt: now,
            },
        });

        if (result.count !== 1) {
            this.throwError(
                "Vé đã được xử lý bởi một yêu cầu khác",
                409
            );
        }

        return prisma.ticket.findUnique({
            where: { id: ticket.id },
            select: {
                id: true,
                ticketCode: true,
                status: true,
                checkInAt: true,
                event: {
                    select: { id: true, name: true },
                },
            },
        });
    }
}

module.exports = new OrganizerTicketService();