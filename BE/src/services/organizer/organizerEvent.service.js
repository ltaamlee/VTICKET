
const prisma = require("../../config/prisma");
const generateSlug = require("../../utils/generateSlug");

class OrganizerEventService {

    async getEvents({
        organizerId,
        page = 1,
        keyword = "",
        status = "",
    }) {
        const currentPage = Math.max(1, Number(page) || 1);
        const pageSize = 10;
        const skip = (currentPage - 1) * pageSize;

        const searchKeyword =
            typeof keyword === "string" ? keyword.trim() : "";

        const where = {
            organizerId,
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

        if (status) {
            where.status = status;
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

    async getEventDetail({ eventId, organizerId }) {
        const event = await prisma.event.findFirst({
            where: {
                id: eventId,
                organizerId,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                eventSessions: true,
            },
        });

        if (!event) {
            const error = new Error("Không tìm thấy sự kiện");
            error.statusCode = 404;
            throw error;
        }

        return event;
    }

    async createEvent({
        organizerId,
        name,
        description,
        thumbnailUrl,
        bannerUrl,
        categoryId,
        location,
        saleStartAt,
        saleEndAt,
        startAt,
        endAt,
    }) {
        if (!organizerId) {
            const error = new Error("Không xác định được tài khoản Ban tổ chức");
            error.statusCode = 401;
            throw error;
        }

        if (!name || typeof name !== "string" || !name.trim()) {
            const error = new Error("Tên sự kiện không được để trống");
            error.statusCode = 400;
            throw error;
        }

        if (!location || typeof location !== "string" || !location.trim()) {
            const error = new Error("Địa điểm không được để trống");
            error.statusCode = 400;
            throw error;
        }

        if (!startAt || !endAt) {
            const error = new Error("Vui lòng nhập thời gian sự kiện");
            error.statusCode = 400;
            throw error;
        }

        const startDate = new Date(startAt);
        const endDate = new Date(endAt);

        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime()) ||
            startDate >= endDate
        ) {
            const error = new Error("Thời gian sự kiện không hợp lệ");
            error.statusCode = 400;
            throw error;
        }

        if (categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: categoryId },
            });

            if (!category) {
                const error = new Error("Danh mục không tồn tại");
                error.statusCode = 404;
                throw error;
            }
        }

        const eventSlug = generateSlug(name);

        const event = await prisma.event.create({
            data: {
                name: name.trim(),
                slug: eventSlug,
                description,
                thumbnailUrl,
                bannerUrl,
                organizerId,
                categoryId: categoryId || null,
                location: location.trim(),
                saleStartAt: saleStartAt ? new Date(saleStartAt) : null,
                saleEndAt: saleEndAt ? new Date(saleEndAt) : null,
                startAt: startDate,
                endAt: endDate,
                status: "DRAFT",
            },
            include: {
                category: true,
            },
        });

        return event;
    }

    async updateEvent({
        eventId,
        organizerId,
        name,
        description,
        thumbnailUrl,
        bannerUrl,
        categoryId,
        location,
        saleStartAt,
        saleEndAt,
        startAt,
        endAt,
    }) {
        const existingEvent = await prisma.event.findFirst({
            where: {
                id: eventId,
                organizerId,
            },
        });

        if (!existingEvent) {
            const error = new Error("Không tìm thấy sự kiện");
            error.statusCode = 404;
            throw error;
        }

        if (existingEvent.status !== "DRAFT") {
            const error = new Error(
                "Chỉ có thể chỉnh sửa sự kiện ở trạng thái bản nháp"
            );
            error.statusCode = 400;
            throw error;
        }

        const data = {};

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                const error = new Error("Tên sự kiện không được để trống");
                error.statusCode = 400;
                throw error;
            }

            data.name = name.trim();
        }

        if (description !== undefined) data.description = description;
        if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;
        if (bannerUrl !== undefined) data.bannerUrl = bannerUrl;
        if (location !== undefined) {
            if (typeof location !== "string" || !location.trim()) {
                const error = new Error("Địa điểm không được để trống");
                error.statusCode = 400;
                throw error;
            }

            data.location = location.trim();
        }

        if (categoryId !== undefined) {
            if (categoryId) {
                const category = await prisma.category.findUnique({
                    where: { id: categoryId },
                });

                if (!category) {
                    const error = new Error("Danh mục không tồn tại");
                    error.statusCode = 404;
                    throw error;
                }
            }

            data.categoryId = categoryId || null;
        }

        if (saleStartAt !== undefined) {
            data.saleStartAt = saleStartAt ? new Date(saleStartAt) : null;
        }

        if (saleEndAt !== undefined) {
            data.saleEndAt = saleEndAt ? new Date(saleEndAt) : null;
        }

        if (startAt !== undefined) data.startAt = new Date(startAt);
        if (endAt !== undefined) data.endAt = new Date(endAt);

        const finalStartAt = data.startAt || existingEvent.startAt;
        const finalEndAt = data.endAt || existingEvent.endAt;

        if (
            Number.isNaN(finalStartAt.getTime()) ||
            Number.isNaN(finalEndAt.getTime()) ||
            finalStartAt >= finalEndAt
        ) {
            const error = new Error("Thời gian sự kiện không hợp lệ");
            error.statusCode = 400;
            throw error;
        }

        return prisma.event.update({
            where: {
                id: eventId,
            },
            data,
            include: {
                category: true,
            },
        });
    }
}

module.exports = new OrganizerEventService();