
const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");

const organizerEventService = require("../../../services/organizer/organizerEvent.service");

class OrganizerEventController {
    constructor(service = organizerEventService) {
        this.organizerEventService = service;
    }

    getEvents = asyncHandler(async (req, res) => {
        const { page = 1, keyword = "", status = "" } = req.query;

        const result = await this.organizerEventService.getEvents({
            organizerId: req.user.id,
            page,
            keyword,
            status,
        });

        return sendResponse(
            res,
            200,
            "Lấy danh sách sự kiện thành công",
            result
        );
    });

    getEventDetail = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.organizerEventService.getEventDetail({
            eventId: id,
            organizerId: req.user.id,
        });

        return sendResponse(
            res,
            200,
            "Xem chi tiết sự kiện thành công",
            result
        );
    });

    createEvent = asyncHandler(async (req, res) => {
        const result = await this.organizerEventService.createEvent({
            ...req.body,
            organizerId: req.user.id,
        });

        return sendResponse(
            res,
            201,
            "Tạo sự kiện thành công",
            result
        );
    });

    updateEvent = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.organizerEventService.updateEvent({
            ...req.body,
            eventId: id,
            organizerId: req.user.id,
        });

        return sendResponse(
            res,
            200,
            "Cập nhật sự kiện thành công",
            result
        );
    });

    submitEvent = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.organizerEventService.submitEvent({
            eventId: id,
            organizerId: req.user.id,
        });

        return sendResponse(
            res,
            200,
            "Gửi sự kiện đến Admin duyệt thành công",
            result
        );
    });

    deleteEvent = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.organizerEventService.deleteEvent({
            eventId: id,
            organizerId: req.user.id,
        });

        return sendResponse(
            res,
            200,
            "Xóa sự kiện thành công",
            result
        );
    });
}

module.exports = new OrganizerEventController();