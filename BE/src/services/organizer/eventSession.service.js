const prisma = require("../../config/prisma");
const BaseService = require("../public/base.service");

class EventSessionService extends BaseService {
    /**
     * Lấy danh sách các suất diễn của một sự kiện
     */
    async getSessionsByEventId(eventId) {
        try {
            if (!eventId) {
                this.throwError("Event ID không hợp lệ");
            }

            const event = await prisma.event.findUnique({
                where: { id: eventId },
            });

            if (!event) {
                this.throwError("Sự kiện không tồn tại", 404);
            }

            const sessions = await prisma.eventSession.findMany({
                where: { eventId },
                orderBy: { startAt: "asc" },
                include: {
                    ticketTypes: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            capacity: true,
                            soldQuantity: true,
                        },
                    },
                },
            });

            return sessions;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy chi tiết một suất diễn
     */
    async getSessionById(sessionId) {
        try {
            if (!sessionId) {
                this.throwError("Session ID không hợp lệ");
            }

            const session = await prisma.eventSession.findUnique({
                where: { id: sessionId },
                include: {
                    event: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    ticketTypes: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            capacity: true,
                            soldQuantity: true,
                        },
                    },
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
    async createSession(eventId, data) {
        try {
            if (!eventId || !data) {
                this.throwError("Dữ liệu không hợp lệ");
            }

            // Kiểm tra sự kiện tồn tại
            const event = await prisma.event.findUnique({
                where: { id: eventId },
            });

            if (!event) {
                this.throwError("Sự kiện không tồn tại", 404);
            }

            // Validate time range
            const startAt = new Date(data.startAt);
            const endAt = new Date(data.endAt);

            if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
                this.throwError("Thời gian không hợp lệ");
            }

            if (startAt >= endAt) {
                this.throwError(
                    "Thời gian kết thúc phải sau thời gian bắt đầu"
                );
            }

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

            // Validate sale dates if provided
            if (data.saleStartAt || data.saleEndAt) {
                const saleStartAt = data.saleStartAt
                    ? new Date(data.saleStartAt)
                    : null;
                const saleEndAt = data.saleEndAt
                    ? new Date(data.saleEndAt)
                    : null;

                if (saleStartAt && isNaN(saleStartAt.getTime())) {
                    this.throwError("Thời gian mở bán bắt đầu không hợp lệ");
                }

                if (saleEndAt && isNaN(saleEndAt.getTime())) {
                    this.throwError("Thời gian mở bán kết thúc không hợp lệ");
                }

                if (saleStartAt && saleEndAt && saleStartAt >= saleEndAt) {
                    this.throwError(
                        "Thời gian mở bán kết thúc phải sau thời gian mở bán bắt đầu"
                    );
                }

                if (saleEndAt && saleEndAt > startAt) {
                    this.throwError(
                        "Thời gian mở bán phải kết thúc trước sự kiện bắt đầu"
                    );
                }
            }

            const newSession = await prisma.eventSession.create({
                data: {
                    eventId,
                    startAt,
                    endAt,
                    saleStartAt: data.saleStartAt
                        ? new Date(data.saleStartAt)
                        : null,
                    saleEndAt: data.saleEndAt
                        ? new Date(data.saleEndAt)
                        : null,
                },
                include: {
                    ticketTypes: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            capacity: true,
                            soldQuantity: true,
                        },
                    },
                },
            });

            return newSession;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cập nhật suất diễn
     */
    async updateSession(sessionId, data) {
        try {
            if (!sessionId || !data) {
                this.throwError("Dữ liệu không hợp lệ");
            }

            const session = await prisma.eventSession.findUnique({
                where: { id: sessionId },
            });

            if (!session) {
                this.throwError("Suất diễn không tồn tại", 404);
            }

            // Check if session has sold tickets
            const soldTickets = await prisma.ticket.findFirst({
                where: {
                    ticketType: {
                        sessionId,
                    },
                    status: { in: ["ISSUED", "CHECKED_IN"] },
                },
            });

            if (soldTickets) {
                this.throwError(
                    "Không thể chỉnh sửa suất diễn đã có vé được bán",
                    400
                );
            }

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
            const startAt =
                updateData.startAt || session.startAt;
            const endAt = updateData.endAt || session.endAt;

            if (startAt >= endAt) {
                this.throwError(
                    "Thời gian kết thúc phải sau thời gian bắt đầu"
                );
            }

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

            // Update sale dates
            if (data.saleStartAt !== undefined) {
                if (data.saleStartAt === null) {
                    updateData.saleStartAt = null;
                } else {
                    const saleStartAt = new Date(data.saleStartAt);
                    if (isNaN(saleStartAt.getTime())) {
                        this.throwError(
                            "Thời gian mở bán bắt đầu không hợp lệ"
                        );
                    }
                    updateData.saleStartAt = saleStartAt;
                }
            }

            if (data.saleEndAt !== undefined) {
                if (data.saleEndAt === null) {
                    updateData.saleEndAt = null;
                } else {
                    const saleEndAt = new Date(data.saleEndAt);
                    if (isNaN(saleEndAt.getTime())) {
                        this.throwError(
                            "Thời gian mở bán kết thúc không hợp lệ"
                        );
                    }
                    updateData.saleEndAt = saleEndAt;
                }
            }

            // Validate sale dates
            const saleStartAt = updateData.saleStartAt || session.saleStartAt;
            const saleEndAt = updateData.saleEndAt || session.saleEndAt;

            if (
                saleStartAt &&
                saleEndAt &&
                saleStartAt >= saleEndAt
            ) {
                this.throwError(
                    "Thời gian mở bán kết thúc phải sau thời gian mở bán bắt đầu"
                );
            }

            if (saleEndAt && saleEndAt > startAt) {
                this.throwError(
                    "Thời gian mở bán phải kết thúc trước sự kiện bắt đầu"
                );
            }

            const updatedSession = await prisma.eventSession.update({
                where: { id: sessionId },
                data: updateData,
                include: {
                    ticketTypes: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            capacity: true,
                            soldQuantity: true,
                        },
                    },
                },
            });

            return updatedSession;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa suất diễn
     */
    async deleteSession(sessionId) {
        try {
            if (!sessionId) {
                this.throwError("Session ID không hợp lệ");
            }

            const session = await prisma.eventSession.findUnique({
                where: { id: sessionId },
            });

            if (!session) {
                this.throwError("Suất diễn không tồn tại", 404);
            }

            // Check if session has sold tickets
            const soldTickets = await prisma.ticket.findFirst({
                where: {
                    ticketType: {
                        sessionId,
                    },
                    status: { in: ["ISSUED", "CHECKED_IN"] },
                },
            });

            if (soldTickets) {
                this.throwError(
                    "Không thể xóa suất diễn đã có vé được bán",
                    400
                );
            }

            // Delete all ticket types associated with this session
            await prisma.ticketType.deleteMany({
                where: { sessionId },
            });

            // Delete the session
            await prisma.eventSession.delete({
                where: { id: sessionId },
            });

            return { id: sessionId };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Kiểm tra xung đột thời gian session
     */
    async checkTimeConflict(eventId, startAt, endAt, excludeSessionId = null) {
        try {
            const where = {
                eventId,
                OR: [
                    {
                        AND: [
                            { startAt: { lt: new Date(endAt) } },
                            { endAt: { gt: new Date(startAt) } },
                        ],
                    },
                ],
            };

            if (excludeSessionId) {
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
