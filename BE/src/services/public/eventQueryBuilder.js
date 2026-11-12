/**
 * EventQueryBuilder - Áp dụng Builder Pattern & Tính Đóng gói (Encapsulation)
 * Chuyên trách việc tiếp nhận các bộ lọc truy vấn từ Client và xây dựng
 * các mệnh đề Prisma (where, orderBy, pagination, include) chuẩn hóa.
 */
class EventQueryBuilder {
    constructor() {
        this.where = {};
        this.orderBy = [];
        this.skip = 0;
        this.take = 10;
        this.page = 1;
    }

    /**
     * Chỉ lấy các sự kiện đã được kiểm duyệt/phát hành cho công chúng
     * @param {string} status 
     * @returns {EventQueryBuilder}
     */
    withStatus(status = "APPROVED") {
        if (status) {
            this.where.status = status;
        }
        return this;
    }

    /**
     * Tìm kiếm từ khóa theo tên, địa điểm, mô tả (không phân biệt hoa thường)
     * @param {string} keyword 
     * @returns {EventQueryBuilder}
     */
    withKeyword(keyword) {
        if (typeof keyword === "string" && keyword.trim()) {
            const cleanKeyword = keyword.trim();
            const keywordConditions = [
                {
                    name: {
                        contains: cleanKeyword,
                        mode: "insensitive",
                    },
                },
                {
                    location: {
                        contains: cleanKeyword,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: cleanKeyword,
                        mode: "insensitive",
                    },
                },
            ];

            if (this.where.OR) {
                // Nếu đã có OR trước đó, lồng vào AND
                this.where.AND = this.where.AND || [];
                this.where.AND.push({ OR: keywordConditions });
            } else {
                this.where.OR = keywordConditions;
            }
        }
        return this;
    }

    /**
     * Lọc theo danh mục (ID hoặc slug)
     * @param {string} categoryId 
     * @param {string} categorySlug 
     * @returns {EventQueryBuilder}
     */
    withCategory(categoryId, categorySlug) {
        if (categoryId && typeof categoryId === "string" && categoryId.trim()) {
            this.where.categoryId = categoryId.trim();
        } else if (categorySlug && typeof categorySlug === "string" && categorySlug.trim()) {
            this.where.category = {
                slug: categorySlug.trim(),
            };
        }
        return this;
    }

    /**
     * Lọc theo địa điểm / tỉnh thành
     * @param {string} location 
     * @returns {EventQueryBuilder}
     */
    withLocation(location) {
        if (typeof location === "string" && location.trim()) {
            this.where.location = {
                contains: location.trim(),
                mode: "insensitive",
            };
        }
        return this;
    }

    /**
     * Lọc theo khoảng thời gian tổ chức sự kiện
     * @param {string|Date} startDate 
     * @param {string|Date} endDate 
     * @returns {EventQueryBuilder}
     */
    withDateRange(startDate, endDate) {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        const dateFilter = {};
        if (start && !Number.isNaN(start.getTime())) {
            dateFilter.gte = start;
        }
        if (end && !Number.isNaN(end.getTime())) {
            dateFilter.lte = end;
        }

        if (Object.keys(dateFilter).length > 0) {
            this.where.startAt = {
                ...(this.where.startAt || {}),
                ...dateFilter,
            };
        }
        return this;
    }

    /**
     * Bộ lọc nhanh theo khung thời gian (Hôm nay, Tuần này, Tháng này, Sắp diễn ra)
     * @param {string} timeFrame 
     * @returns {EventQueryBuilder}
     */
    withTimeFrame(timeFrame) {
        if (!timeFrame) return this;

        const now = new Date();

        switch (timeFrame.toLowerCase()) {
            case "today": {
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                this.where.startAt = {
                    ...(this.where.startAt || {}),
                    gte: startOfToday,
                    lte: endOfToday,
                };
                break;
            }
            case "this_week": {
                const dayOfWeek = now.getDay() || 7; // Chuyển Chủ nhật thành 7
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);

                this.where.startAt = {
                    ...(this.where.startAt || {}),
                    gte: startOfWeek,
                    lte: endOfWeek,
                };
                break;
            }
            case "this_month": {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

                this.where.startAt = {
                    ...(this.where.startAt || {}),
                    gte: startOfMonth,
                    lte: endOfMonth,
                };
                break;
            }
            case "upcoming": {
                this.where.startAt = {
                    ...(this.where.startAt || {}),
                    gte: now,
                };
                break;
            }
            default:
                break;
        }

        return this;
    }

    /**
     * Lọc theo khoảng giá vé hoặc vé miễn phí
     * @param {number|string} minPrice 
     * @param {number|string} maxPrice 
     * @param {boolean|string} isFree 
     * @returns {EventQueryBuilder}
     */
    withPriceRange(minPrice, maxPrice, isFree) {
        const free = isFree === true || isFree === "true";

        if (free) {
            this.where.ticketTypes = {
                some: {
                    price: 0,
                    status: "ACTIVE",
                },
            };
            return this;
        }

        const priceFilter = {};
        if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
            const min = Number(minPrice);
            if (!Number.isNaN(min)) {
                priceFilter.gte = min;
            }
        }

        if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
            const max = Number(maxPrice);
            if (!Number.isNaN(max)) {
                priceFilter.lte = max;
            }
        }

        if (Object.keys(priceFilter).length > 0) {
            this.where.ticketTypes = {
                some: {
                    price: priceFilter,
                    status: "ACTIVE",
                },
            };
        }

        return this;
    }

    /**
     * Sắp xếp kết quả
     * @param {string} sortBy 
     * @param {string} sortOrder 
     * @returns {EventQueryBuilder}
     */
    withSorting(sortBy = "startAt", sortOrder = "asc") {
        const order = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

        switch (sortBy) {
            case "createdAt":
                this.orderBy = [{ createdAt: order }];
                break;
            case "name":
                this.orderBy = [{ name: order }];
                break;
            case "startAt":
            default:
                this.orderBy = [{ startAt: order }];
                break;
        }

        return this;
    }

    /**
     * Phân trang
     * @param {number|string} page 
     * @param {number|string} limit 
     * @returns {EventQueryBuilder}
     */
    withPagination(page = 1, limit = 10) {
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

        this.page = currentPage;
        this.take = pageSize;
        this.skip = (currentPage - 1) * pageSize;

        return this;
    }

    /**
     * Include quan hệ tóm tắt cho danh sách
     * @returns {Object}
     */
    static getSummaryInclude() {
        return {
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
            ticketTypes: {
                where: {
                    status: "ACTIVE",
                },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    capacity: true,
                    soldQuantity: true,
                    status: true,
                    saleStartAt: true,
                    saleEndAt: true,
                },
            },
        };
    }

    /**
     * Include quan hệ chi tiết cho trang Event Detail
     * @returns {Object}
     */
    static getDetailInclude() {
        return {
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
                    username: true,
                    email: true,
                    organizerProfile: true,
                },
            },
            ticketTypes: {
                where: {
                    status: "ACTIVE",
                },
                include: {
                    zone: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            color: true,
                            type: true,
                            shape: true,
                        },
                    },
                },
            },
            seatMap: {
                include: {
                    zones: true,
                },
            },
        };
    }

    /**
     * Lấy mệnh đề where đã build
     * @returns {Object}
     */
    buildWhere() {
        return this.where;
    }

    /**
     * Lấy mệnh đề orderBy đã build
     * @returns {Array}
     */
    buildOrderBy() {
        return this.orderBy.length > 0 ? this.orderBy : [{ startAt: "asc" }];
    }

    /**
     * Lấy thông số phân trang
     * @returns {{ skip: number, take: number, page: number, limit: number }}
     */
    buildPagination() {
        return {
            skip: this.skip,
            take: this.take,
            page: this.page,
            limit: this.take,
        };
    }
}

module.exports = EventQueryBuilder;

