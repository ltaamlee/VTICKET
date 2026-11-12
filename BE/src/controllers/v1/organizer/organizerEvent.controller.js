
const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");

const organizerEventService = require("../../../services/organizer/organizerEvent.service");

class OrganizerEventController {
    constructor(service = organizerEventService) {
        this.organizerEventService = service;
    }

    // Lấy danh sách sự kiện
    getEvents = asyncHandler(async (req, res) => {
        const { page = 1, keyword = "", status = "" } = req.query;

        const result = await this.organizerEventService.getEvents({
            organizerId: req.user.id,
            page,
            keyword,
            status,
        });

        return sendResponse( res, 200, "Lấy danh sách sự kiện thành công", result );
    });

    getEventStats = asyncHandler(async (req, res) => {
        const result = await this.organizerEventService.getEventStats({
            organizerId: req.user.id,
        });

        return sendResponse( res, 200, "Lấy thống kê sự kiện thành công", result );
    });

    // Xem chi tiết sự kiện
    getEventDetail = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.organizerEventService.getEventDetail({
            eventId: id,
            organizerId: req.user.id,
        });

        return sendResponse( res, 200, "Xem chi tiết sự kiện thành công", result );
    });

    // Tạo sự kiện
    createEvent = asyncHandler(async (req, res) => {
        const result = await this.organizerEventService.createEvent({
            ...req.body,
            organizerId: req.user.id,
        });

        return sendResponse( res, 201, "Tạo sự kiện thành công", result );
    });

    // Cập nhật sự kiện
    updateEvent = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.organizerEventService.updateEvent({
            ...req.body,
            eventId: id,
            organizerId: req.user.id,
        });

        return sendResponse( res, 200, "Cập nhật sự kiện thành công", result );
    });

    // Gửi phê duyệt sự kiện đến Admin
    submitEvent = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.organizerEventService.submitEvent({
            eventId: id,
            organizerId: req.user.id,
        });

        return sendResponse( res, 200, "Gửi sự kiện đến Admin duyệt thành công", result );
    });

    // Xóa sự kiện
    deleteEvent = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.organizerEventService.deleteEvent({
            eventId: id,
            organizerId: req.user.id,
        });

        return sendResponse( res, 200, "Xóa sự kiện thành công", result );
    });
}

module.exports = new OrganizerEventController();