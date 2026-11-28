const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");
const eventService = require("../../../services/public/event.service");
const orderService = require("../../../services/user/order.service");

class EventController {
    constructor(service = eventService) {
        this.eventService = service;
    }

    getAvailableSeats = asyncHandler(async (req, res) => {
        const result = await orderService.getAvailableSeats({ eventId: req.params.id, sessionId: req.query.sessionId });
        return sendResponse(res, 200, "Lấy danh sách ghế thành công", result);
    });

    getEvents = asyncHandler(async (req, res) => {
        const result = await this.eventService.getEvents(req.query);
        return sendResponse(res, 200, "Lấy danh sách sự kiện thành công", result);
    });


    getFeaturedEvents = asyncHandler(async (req, res) => {
        const { limit } = req.query;
        const result = await this.eventService.getFeaturedEvents(limit);
        return sendResponse(res, 200, "Lấy danh sách sự kiện nổi bật thành công", result);
    });


    getUpcomingEvents = asyncHandler(async (req, res) => {
        const { limit } = req.query;
        const result = await this.eventService.getUpcomingEvents(limit);
        return sendResponse(res, 200, "Lấy danh sách sự kiện sắp diễn ra thành công", result);
    });


    getEventDetail = asyncHandler(async (req, res) => {
        const { idOrSlug } = req.params;
        const result = await this.eventService.getEventDetail(idOrSlug);
        return sendResponse(res, 200, "Xem chi tiết sự kiện thành công", result);
    });
}

module.exports = new EventController();
