const prisma = require("../../config/prisma");
const BaseService = require("../public/base.service");

class EventSessionService extends BaseService {
    validateObjectId(id, fieldName) {
        if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) {
            this.throwError(`${fieldName} không hợp lệ`);
        }
    }

    async getOrganizerEvent(eventId, organizerId) {
        this.validateObjectId(eventId, "Event ID");

        if (!organizerId) {
            this.throwError("Không xác định được tài khoản Ban tổ chức", 401);
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                organizerId: true,
                startAt: true,
                endAt: true,
            },
        });

        if (!event) {
            this.throwError("Sự kiện không tồn tại", 404);
        }

        if (event.organizerId !== organizerId) {
            this.throwError("Bạn không có quyền quản lý sự kiện này", 403);
        }

        return event;
    }

    async assertNoSoldTickets(eventId, sessionId, message) {
        const soldTicket = await prisma.ticket.findFirst({
            where: {
                eventId,
                ticketType: { sessionId },
                status: { in: ["RESERVED", "ISSUED", "CHECKED_IN"] },
            },
            select: { id: true },
        });

        if (soldTicket) {
            this.throwError(message, 400);
        }
    }

    validateSessionRange(event, startAt, endAt) {
        if (startAt >= endAt) {
            this.throwError("Thời gian kết thúc phải sau thời gian bắt đầu");
        }

        if (startAt < event.startAt || endAt > event.endAt) {
            this.throwError("Suất diễn phải nằm trong thời gian diễn ra sự kiện");
        }
    }

    async ensureSessionTicketTypes(eventId) {
        await prisma.$transaction(async (tx) => {
            const [sessions, ticketTypes] = await Promise.all([
                tx.eventSession.findMany({ where: { eventId } }),
                tx.ticketType.findMany({ where: { eventId } }),
            ]);
            const eventTicketTypes = ticketTypes.filter(
                (ticketType) => !ticketType.sessionId
            );

            if (eventTicketTypes.length === 0) return;

            for (const session of sessions) {
                if (
                    ticketTypes.some(
                        (ticketType) => ticketType.sessionId === session.id
                    )
                ) {
                    continue;
                }

                for (const ticketType of eventTicketTypes) {
                    await tx.ticketType.create({
                        data: {
                            eventId,
                            sessionId: session.id,
                            zoneId: ticketType.zoneId,
                            name: ticketType.name,
                            price: ticketType.price,
                            capacity: ticketType.capacity,
                            saleStartAt: ticketType.saleStartAt,
                            saleEndAt: ticketType.saleEndAt,
                            status: ticketType.status,
                        },
                    });
                }
            }
        });
    }

    /**
     * Lấy danh sách các suất diễn của một sự kiện
     */
    async getSessionsByEventId(eventId, organizerId) {
        try {
            await this.getOrganizerEvent(eventId, organizerId);
            await this.ensureSessionTicketTypes(eventId);

            return prisma.eventSession.findMany({
                where: { eventId },
                orderBy: { startAt: "asc" },
                include: { ticketTypes: true },
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy chi tiết một suất diễn
     */
    async getSessionById(eventId, sessionId, organizerId) {
        try {
            await this.getOrganizerEvent(eventId, organizerId);
            this.validateObjectId(sessionId, "Session ID");

            const session = await prisma.eventSession.findFirst({
                where: { id: sessionId, eventId },
                include: {
                    event: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    ticketTypes: true,
                },
            });

            if (!session) {
                this.throwError("Suất diễn không tồn tại", 404);
            }

            return session;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Tạo mới suất diễn
     */
    async createSession(eventId, data, organizerId) {
        try {
            if (!eventId || !data) {
                this.throwError("Dữ liệu không hợp lệ");
            }

            const event = await this.getOrganizerEvent(eventId, organizerId);

            // Validate time range
            const startAt = new Date(data.startAt);
            const endAt = new Date(data.endAt);

            if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
                this.throwError("Thời gian không hợp lệ");
            }

            this.validateSessionRange(event, startAt, endAt);

            // Check overlapping sessions
            const overlappingSession = await prisma.eventSession.findFirst({
                where: {
                    eventId,
                    OR: [
                        {
                            AND: [
                                { startAt: { lt: endAt } },
                                { endAt: { gt: startAt } },
                            ],
                        },
                    ],
                },
            });

            if (overlappingSession) {
                this.throwError(
                    "Thời gian này trùng với suất diễn khác"
                );
            }

            return prisma.$transaction(async (tx) => {
                const session = await tx.eventSession.create({
                    data: { eventId, startAt, endAt },
                });
                const eventTicketTypes = await tx.ticketType.findMany({
                    where: { eventId },
                });

                for (const ticketType of eventTicketTypes.filter(
                    (item) => !item.sessionId
                )) {
                    await tx.ticketType.create({
                        data: {
                            eventId,
                            sessionId: session.id,
                            zoneId: ticketType.zoneId,
                            name: ticketType.name,
                            price: ticketType.price,
                            capacity: ticketType.capacity,
                            saleStartAt: ticketType.saleStartAt,
                            saleEndAt: ticketType.saleEndAt,
                            status: ticketType.status,
                        },
                    });
                }

                return tx.eventSession.findUnique({
                    where: { id: session.id },
                    include: { ticketTypes: true },
                });
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cập nhật suất diễn
     */
    async updateSession(eventId, sessionId, data, organizerId) {
        try {
            if (!eventId || !sessionId || !data) {
                this.throwError("Dữ liệu không hợp lệ");
            }

            this.validateObjectId(sessionId, "Session ID");
            const session = await prisma.eventSession.findUnique({
                where: { id: sessionId },
            });

            if (!session) {
                this.throwError("Suất diễn không tồn tại", 404);
            }

            if (session.eventId !== eventId) {
                this.throwError("Suất diễn không thuộc sự kiện này", 404);
            }

            const event = await this.getOrganizerEvent(eventId, organizerId);

            await this.assertNoSoldTickets(
                eventId,
                sessionId,
                "Không thể chỉnh sửa suất diễn khi có vé đang giữ hoặc đã bán"
            );

            const updateData = {};

            // Update startAt if provided
            if (data.startAt !== undefined) {
                const startAt = new Date(data.startAt);
                if (isNaN(startAt.getTime())) {
                    this.throwError("Thời gian bắt đầu không hợp lệ");
                }
                updateData.startAt = startAt;
            }

            // Update endAt if provided
            if (data.endAt !== undefined) {
                const endAt = new Date(data.endAt);
                if (isNaN(endAt.getTime())) {
                    this.throwError("Thời gian kết thúc không hợp lệ");
                }
                updateData.endAt = endAt;
            }

            // Validate time range if both provided
            const startAt = updateData.startAt ?? session.startAt;
            const endAt = updateData.endAt ?? session.endAt;
            this.validateSessionRange(event, startAt, endAt);

            // Check for overlapping sessions (excluding current session)
            if (data.startAt !== undefined || data.endAt !== undefined) {
                const overlappingSession = await prisma.eventSession.findFirst({
                    where: {
                        eventId: session.eventId,
                        id: { not: sessionId },
                        OR: [
                            {
                                AND: [
                                    { startAt: { lt: endAt } },
                                    { endAt: { gt: startAt } },
                                ],
                            },
                        ],
                    },
                });

                if (overlappingSession) {
                    this.throwError(
                        "Thời gian này trùng với suất diễn khác"
                    );
                }
            }

            return prisma.eventSession.update({
                where: { id: sessionId },
                data: updateData,
                include: { ticketTypes: true },
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa suất diễn
     */
    async deleteSession(eventId, sessionId, organizerId) {
        try {
            if (!eventId || !sessionId) {
                this.throwError("Dữ liệu không hợp lệ");
            }

            this.validateObjectId(sessionId, "Session ID");
            const session = await prisma.eventSession.findUnique({
                where: { id: sessionId },
            });

            if (!session) {
                this.throwError("Suất diễn không tồn tại", 404);
            }

            if (session.eventId !== eventId) {
                this.throwError("Suất diễn không thuộc sự kiện này", 404);
            }

            await this.getOrganizerEvent(eventId, organizerId);

            const linkedTicketTypes = await prisma.ticketType.findMany({
                where: { sessionId },
                include: {
                    _count: {
                        select: { tickets: true, orderItems: true },
                    },
                },
            });
            if (
                linkedTicketTypes.some(
                    (ticketType) =>
                        ticketType.soldQuantity > 0 ||
                        ticketType._count.tickets > 0 ||
                        ticketType._count.orderItems > 0
                )
            ) {
                this.throwError(
                    "Không thể xóa suất diễn khi vé đã được bán hoặc có đơn hàng",
                    400
                );
            }

            await prisma.$transaction(async (tx) => {
                await tx.ticketType.deleteMany({ where: { sessionId } });
                await tx.eventSession.delete({ where: { id: sessionId } });
            });

            return { id: sessionId };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Kiểm tra xung đột thời gian session
     */
    async checkTimeConflict(
        eventId,
        startAt,
        endAt,
        excludeSessionId = null,
        organizerId
    ) {
        try {
            const event = await this.getOrganizerEvent(eventId, organizerId);
            const parsedStartAt = new Date(startAt);
            const parsedEndAt = new Date(endAt);

            if (
                Number.isNaN(parsedStartAt.getTime()) ||
                Number.isNaN(parsedEndAt.getTime())
            ) {
                this.throwError("Thời gian không hợp lệ");
            }

            this.validateSessionRange(event, parsedStartAt, parsedEndAt);

            const where = {
                eventId,
                OR: [
                    {
                        AND: [
                            { startAt: { lt: parsedEndAt } },
                            { endAt: { gt: parsedStartAt } },
                        ],
                    },
                ],
            };

            if (excludeSessionId) {
                this.validateObjectId(excludeSessionId, "Session ID");
                where.id = { not: excludeSessionId };
            }

            const conflict = await prisma.eventSession.findFirst({
                where,
            });

            return !!conflict;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new EventSessionService();
