
const prisma = require("../../config/prisma");

class EventService {
    async getEvents({
        page = 1,
        keyword = "",
        categoryId = "",
        status = "",
    } = {}) {
        const currentPage = Math.max(1, Number(page) || 1);
        const pageSize = 10;
        const skip = (currentPage - 1) * pageSize;

        const searchKeyword =
            typeof keyword === "string" ? keyword.trim() : "";

        const where = {
            status: "PUBLISHED",
        };

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
            ];
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        const [events, totalEvents] = await Promise.all([
            prisma.event.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    startAt: "asc",
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            }),

            prisma.event.count({ where }),
        ]);

        return {
            events,
            pagination: {
                currentPage,
                pageSize,
                totalEvents,
                totalPages: Math.ceil(totalEvents / pageSize),
            },
        };
    }

    async getEventDetail({ eventId }) {
        const event = await prisma.event.findFirst({
            where: {
                id: eventId,
                status: "PUBLISHED",
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        if (!event) {
            const error = new Error("Không tìm thấy sự kiện");
            error.statusCode = 404;
            throw error;
        }

        return event;
    }
}

module.exports = new EventService();