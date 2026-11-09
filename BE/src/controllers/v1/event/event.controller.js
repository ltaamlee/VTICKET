const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");
const eventService = require("../../../services/event/event.service");

/**
 * EventController - Bộ điều khiển HTTP cho sự kiện công khai (Public Events)
 * Áp dụng nguyên lý Single Responsibility (SRP) và Dependency Injection trong OOP.
 */
class EventController {
    constructor(service = eventService) {
        this.eventService = service;
    }

    /**
     * Lấy danh sách sự kiện kèm tìm kiếm, lọc, phân trang
     * GET /api/v1/events
     */
    getEvents = asyncHandler(async (req, res) => {
        const result = await this.eventService.getEvents(req.query);
        return sendResponse(res, 200, "Lấy danh sách sự kiện thành công", result);
    });

    /**
     * Lấy danh sách sự kiện nổi bật
     * GET /api/v1/events/featured
     */
    getFeaturedEvents = asyncHandler(async (req, res) => {
        const { limit } = req.query;
        const result = await this.eventService.getFeaturedEvents(limit);
        return sendResponse(res, 200, "Lấy danh sách sự kiện nổi bật thành công", result);
    });

    /**
     * Lấy danh sách sự kiện sắp diễn ra
     * GET /api/v1/events/upcoming
     */
    getUpcomingEvents = asyncHandler(async (req, res) => {
        const { limit } = req.query;
        const result = await this.eventService.getUpcomingEvents(limit);
        return sendResponse(res, 200, "Lấy danh sách sự kiện sắp diễn ra thành công", result);
    });

    /**
     * Xem thông tin chi tiết sự kiện theo ID hoặc Slug
     * GET /api/v1/events/:idOrSlug
     */
    getEventDetail = asyncHandler(async (req, res) => {
        const { idOrSlug } = req.params;
        const result = await this.eventService.getEventDetail(idOrSlug);
        return sendResponse(res, 200, "Xem chi tiết sự kiện thành công", result);
    });
}

module.exports = new EventController();
