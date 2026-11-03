
const prisma = require("../../config/prisma");
const generateSlug = require("../../utils/generateSlug");

class OrganizerEventService {
    throwError(message, statusCode = 400) {
        const error = new Error(message);
        error.statusCode = statusCode;
        throw error;
    }

    handlePrismaError(error) {
        if (error.code === "P2002") {
            this.throwError(
                "Slug này đã tồn tại. Vui lòng chọn slug khác.",
                409
            );
        }

        throw error;
    }

    validateOrganizer(organizerId) {
        if (!organizerId) {
            this.throwError(
                "Không xác định được tài khoản Ban tổ chức",
                401
            );
        }
    }

    parseDate(value, fieldName) {
        const date = new Date(value);

        if (!value || Number.isNaN(date.getTime())) {
            this.throwError(`${fieldName} không hợp lệ`);
        }

        return date;
    }

    async validateCategory(categoryId) {
        if (!categoryId) {
            this.throwError("Vui lòng chọn danh mục sự kiện");
        }

        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            select: { id: true },
        });

        if (!category) {
            this.throwError("Danh mục không tồn tại", 404);
        }
    }

    async validateSlug(slug, excludeEventId = null) {
        if (typeof slug !== "string" || !slug.trim()) {
            this.throwError("Slug không được để trống");
        }

        const existingEvent = await prisma.event.findUnique({
            where: {
                slug: slug.trim(),
            },
            select: {
                id: true,
            },
        });

        if (
            existingEvent &&
            existingEvent.id !== excludeEventId
        ) {
            this.throwError(
                "Slug này đã tồn tại. Vui lòng chọn slug khác.",
                409
            );
        }
    }

    async getEvents({
        organizerId,
        page = 1,
        keyword = "",
        status = "",
    }) {
        this.validateOrganizer(organizerId);

        const currentPage = Math.max(1, Number(page) || 1);
        const pageSize = 10;
        const skip = (currentPage - 1) * pageSize;

        const searchKeyword =
            typeof keyword === "string" ? keyword.trim() : "";

        const where = { organizerId };

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
            const allowedStatuses = [
                "DRAFT",
                "PENDING",
                "PUBLISHED",
                "REJECTED",
                "CANCELLED",
                "COMPLETED",
                "SUSPENDED",
            ];

            if (!allowedStatuses.includes(status)) {
                this.throwError("Trạng thái sự kiện không hợp lệ");
            }

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
        this.validateOrganizer(organizerId);

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
            this.throwError("Không tìm thấy sự kiện", 404);
        }

        return event;
    }

    async createEvent({
        organizerId,
        name,
        slug,
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
        this.validateOrganizer(organizerId);

        if (typeof name !== "string" || !name.trim()) {
            this.throwError("Tên sự kiện không được để trống");
        }

        if (typeof location !== "string" || !location.trim()) {
            this.throwError("Địa điểm không được để trống");
        }

        await this.validateCategory(categoryId);

        const eventSlug = slug?.trim() || generateSlug(name.trim());

        await this.validateSlug(eventSlug);

        const startDate = this.parseDate(
            startAt,
            "Thời gian bắt đầu sự kiện"
        );

        const endDate = this.parseDate(
            endAt,
            "Thời gian kết thúc sự kiện"
        );

        if (startDate >= endDate) {
            this.throwError(
                "Thời gian kết thúc phải sau thời gian bắt đầu"
            );
        }

        const saleStartDate = saleStartAt
            ? this.parseDate(saleStartAt, "Thời gian mở bán")
            : null;

        const saleEndDate = saleEndAt
            ? this.parseDate(saleEndAt, "Thời gian kết thúc bán vé")
            : null;

        if (
            saleStartDate &&
            saleEndDate &&
            saleStartDate >= saleEndDate
        ) {
            this.throwError(
                "Thời gian kết thúc bán vé phải sau thời gian mở bán"
            );
        }

        try {
            return await prisma.event.create({
                data: {
                    name: name.trim(),
                    slug: eventSlug,
                    description,
                    thumbnailUrl,
                    bannerUrl,
                    organizerId,
                    categoryId,
                    location: location.trim(),
                    saleStartAt: saleStartDate,
                    saleEndAt: saleEndDate,
                    startAt: startDate,
                    endAt: endDate,
                    status: "DRAFT",
                },
                include: {
                    category: true,
                },
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async updateEvent({
        eventId,
        organizerId,
        name,
        slug,
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
        this.validateOrganizer(organizerId);

        const existingEvent = await prisma.event.findFirst({
            where: {
                id: eventId,
                organizerId,
            },
        });

        if (!existingEvent) {
            this.throwError("Không tìm thấy sự kiện", 404);
        }

        const editableStatuses = ["DRAFT", "REJECTED"];

        if (!editableStatuses.includes(existingEvent.status)) {
            this.throwError(
                "Chỉ có thể chỉnh sửa sự kiện ở trạng thái bản nháp hoặc bị từ chối"
            );
        }

        const data = {};

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                this.throwError("Tên sự kiện không được để trống");
            }

            data.name = name.trim();
        }

        if (slug !== undefined) {
            data.slug = slug.trim();
        } else if (name !== undefined) {
            data.slug = generateSlug(name.trim());
        }

        if (data.slug !== undefined) {
            await this.validateSlug(data.slug, existingEvent.id);
        }

        if (description !== undefined) {
            data.description = description;
        }

        if (thumbnailUrl !== undefined) {
            data.thumbnailUrl = thumbnailUrl;
        }

        if (bannerUrl !== undefined) {
            data.bannerUrl = bannerUrl;
        }

        if (location !== undefined) {
            if (typeof location !== "string" || !location.trim()) {
                this.throwError("Địa điểm không được để trống");
            }

            data.location = location.trim();
        }

        if (categoryId !== undefined) {
            await this.validateCategory(categoryId);
            data.categoryId = categoryId;
        }

        if (saleStartAt !== undefined) {
            data.saleStartAt = saleStartAt
                ? this.parseDate(saleStartAt, "Thời gian mở bán")
                : null;
        }

        if (saleEndAt !== undefined) {
            data.saleEndAt = saleEndAt
                ? this.parseDate(
                    saleEndAt,
                    "Thời gian kết thúc bán vé"
                )
                : null;
        }

        if (startAt !== undefined) {
            data.startAt = this.parseDate(
                startAt,
                "Thời gian bắt đầu sự kiện"
            );
        }

        if (endAt !== undefined) {
            data.endAt = this.parseDate(
                endAt,
                "Thời gian kết thúc sự kiện"
            );
        }

        const finalStartAt = data.startAt ?? existingEvent.startAt;
        const finalEndAt = data.endAt ?? existingEvent.endAt;

        if (finalStartAt >= finalEndAt) {
            this.throwError(
                "Thời gian kết thúc phải sau thời gian bắt đầu"
            );
        }

        const finalSaleStartAt =
            data.saleStartAt !== undefined
                ? data.saleStartAt
                : existingEvent.saleStartAt;

        const finalSaleEndAt =
            data.saleEndAt !== undefined
                ? data.saleEndAt
                : existingEvent.saleEndAt;

        if (
            finalSaleStartAt &&
            finalSaleEndAt &&
            finalSaleStartAt >= finalSaleEndAt
        ) {
            this.throwError(
                "Thời gian kết thúc bán vé phải sau thời gian mở bán"
            );
        }

        try {
            return await prisma.event.update({
                where: {
                    id: existingEvent.id,
                },
                data,
                include: {
                    category: true,
                },
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async submitEvent({ eventId, organizerId }) {
        this.validateOrganizer(organizerId);

        const event = await prisma.event.findFirst({
            where: {
                id: eventId,
                organizerId,
            },
        });

        if (!event) {
            this.throwError("Không tìm thấy sự kiện", 404);
        }

        const submitableStatuses = ["DRAFT", "REJECTED"];

        if (!submitableStatuses.includes(event.status)) {
            this.throwError(
                "Chỉ có thể gửi duyệt sự kiện ở trạng thái bản nháp hoặc bị từ chối"
            );
        }

        if (
            !event.name ||
            !event.slug ||
            !event.location ||
            !event.categoryId ||
            !event.startAt ||
            !event.endAt
        ) {
            this.throwError(
                "Vui lòng hoàn thiện thông tin sự kiện trước khi gửi duyệt"
            );
        }

        if (event.startAt >= event.endAt) {
            this.throwError("Thời gian sự kiện không hợp lệ");
        }

        return prisma.event.update({
            where: {
                id: event.id,
            },
            data: {
                status: "PENDING",
                rejectReason: null,
                reviewedAt: null,
            },
            include: {
                category: true,
            },
        });
    }

    async deleteEvent({ eventId, organizerId }) {
        this.validateOrganizer(organizerId);

        const result = await prisma.event.deleteMany({
            where: {
                id: eventId,
                organizerId,
                status: {
                    in: ["DRAFT", "REJECTED"],
                },
            },
        });

        if (result.count === 0) {
            this.throwError(
                "Không tìm thấy sự kiện hoặc bạn không có quyền xóa sự kiện này",
                404
            );
        }

        return {
            message: "Xóa sự kiện thành công",
        };
    }
}

module.exports = new OrganizerEventService();