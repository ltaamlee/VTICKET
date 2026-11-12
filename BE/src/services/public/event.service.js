const prisma = require("../../config/prisma");
const EventStatus = require("../../shared/eventStatus")

const EventMapper = require("../../mappers/event.mapper");
const EventQueryBuilder = require("./eventQueryBuilder");
const { NotFoundException, BadRequestException } = require("../../exceptions");

class EventService {
    constructor(
        prismaClient = prisma,
        queryBuilderClass = EventQueryBuilder,
        mapper = EventMapper
    ) {
        this.prisma = prismaClient;
        this.QueryBuilder = queryBuilderClass;
        this.mapper = mapper;
    }

    /**
     * Kiểm tra chuỗi có phải là ObjectId hợp lệ của MongoDB
     * @param {string} id 
     * @returns {boolean}
     */
    isValidObjectId(id) {
        if (!id || typeof id !== "string") return false;
        return /^[0-9a-fA-F]{24}$/.test(id);
    }

    /**
     * Lấy danh sách sự kiện kèm theo tìm kiếm, lọc, phân trang và sắp xếp
     * @param {Object} queryParams
     * @returns {Promise<{ events: Array, pagination: Object }>}
     */
    async getEvents(queryParams = {}) {
        const {
            page = 1,
            limit = 10,
            pageSize,
            keyword = "",
            categoryId = "",
            categorySlug = "",
            location = "",
            startDate,
            endDate,
            timeFrame = "",
            minPrice,
            maxPrice,
            isFree,
            sortBy = "startAt",
            sortOrder = "asc",
        } = queryParams;

        // Khởi tạo QueryBuilder để đóng gói toàn bộ logic lọc
        const builder = new this.QueryBuilder()
            .withStatus("APPROVED")
            .withKeyword(keyword)
            .withCategory(categoryId, categorySlug)
            .withLocation(location)
            .withDateRange(startDate, endDate)
            .withTimeFrame(timeFrame)
            .withPriceRange(minPrice, maxPrice, isFree)
            .withSorting(sortBy, sortOrder)
            .withPagination(page, pageSize || limit);

        const where = builder.buildWhere();
        const orderBy = builder.buildOrderBy();
        const { skip, take, page: currentPage, limit: parsedLimit } = builder.buildPagination();

        // Thực thi song song lấy dữ liệu và đếm tổng số bản ghi
        const [events, totalEvents] = await Promise.all([
            this.prisma.event.findMany({
                where,
                skip,
                take,
                orderBy,
                include: this.QueryBuilder.getSummaryInclude(),
            }),
            this.prisma.event.count({ where }),
        ]);

        const totalPages = Math.ceil(totalEvents / parsedLimit);
        const pagination = {
            currentPage,
            pageSize: parsedLimit,
            totalEvents,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
        };

        return this.mapper.toEventListResponse(events, pagination);
    }

    /**
     * Lấy danh sách sự kiện nổi bật (phục vụ Banner, Home Page)
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    async getFeaturedEvents(limit = 6) {
        const take = Math.max(1, Math.min(20, parseInt(limit, 10) || 6));
        const now = new Date();

        const events = await this.prisma.event.findMany({
            where: {
                status: "APPROVED",
                endAt: {
                    gte: now,
                },
            },
            take,
            orderBy: [
                { startAt: "asc" },
                { createdAt: "desc" },
            ],
            include: this.QueryBuilder.getSummaryInclude(),
        });

        return events.map((event) => this.mapper.toEventSummaryResponse(event));
    }

    /**
     * Lấy danh sách sự kiện sắp diễn ra gần nhất
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    async getUpcomingEvents(limit = 8) {
        const take = Math.max(1, Math.min(30, parseInt(limit, 10) || 8));
        const now = new Date();

        const events = await this.prisma.event.findMany({
            where: {
                status: "APPROVED",
                startAt: {
                    gte: now,
                },
            },
            take,
            orderBy: {
                startAt: "asc",
            },
            include: this.QueryBuilder.getSummaryInclude(),
        });

        return events.map((event) => this.mapper.toEventSummaryResponse(event));
    }

    /**
     * Xem chi tiết sự kiện theo ID (ObjectId) hoặc theo Slug
     * @param {string} identifier 
     * @returns {Promise<Object>}
     */
    async getEventDetail(identifier) {
        if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
            throw new BadRequestException("Mã định danh sự kiện (ID hoặc Slug) không hợp lệ");
        }

        const cleanIdentifier = identifier.trim();
        const isObjectId = this.isValidObjectId(cleanIdentifier);

        // Tìm theo ObjectId hoặc theo Slug
        const where = isObjectId
            ? { id: cleanIdentifier, status: "APPROVED" }
            : { slug: cleanIdentifier, status: "APPROVED" };

        const event = await this.prisma.event.findFirst({
            where,
            include: this.QueryBuilder.getDetailInclude(),
        });

        if (!event) {
            throw new NotFoundException("Không tìm thấy thông tin sự kiện hoặc sự kiện chưa được công bố");
        }

        return this.mapper.toEventDetailResponse(event);
    }
}

module.exports = new EventService();
