const adminEventService = require("../../../services/admin/adminEvent.service");
const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");

class AdminEventController {

    constructor(service = adminEventService) {
        this.adminEventService = service;
    }

    // Thống kê sự kiện
    getEventStats = asyncHandler(async (req, res) => {
        const result = await this.adminEventService.getEventStats();

        return sendResponse(res, 200, "Lấy thống kê sự kiện thành công", result);
    });

    getEvents = asyncHandler(async (req, res) => {
        const { page = 1, keyword = "", status = "", categoryId = "", } = req.query;

        const result = await this.adminEventService.getEvents({
            page,
            keyword,
            status,
            categoryId,
        });

        return sendResponse(res, 200, "Lấy danh sách sự kiện thành công", {
            events: result.events,
            pagination: result.pagination,
        });
    });

    // Xem chi tiết sự kiện
    getEventDetail = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminEventService.getEventDetail({
            eventId: id,
        });

        return sendResponse( res, 200, "Xem chi tiết sự kiện thành công", result );
    });

    // GET /admin/seat-maps/:id
    getSeatMapDetail = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminEventService.getSeatMapDetail({
            seatMapId: id,
        });

        return sendResponse( res, 200, "Xem chi tiết sơ đồ ghế thành công", result );
    });

    // Duyệt sự kiện
    approveEvent = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminEventService.approveEvent({
            eventId: id,
        });

        return sendResponse( res, 200, "Duyệt sự kiện thành công", result );
    });

    // Từ chối sự kiện
    rejectEvent = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { reason } = req.body;

        const result = await this.adminEventService.rejectEvent({
            eventId: id,
            reason,
        });

        return sendResponse( res, 200, "Từ chối sự kiện thành công", result );
    });

    // Tạm khóa sự kiện
    suspendEvent = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminEventService.suspendEvent({
            eventId: id,
        });

        return sendResponse( res, 200, "Khóa sự kiện thành công", result );
    });

    // Mở khóa sự kiện
    restoreEvent = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminEventService.restoreEvent({
            eventId: id,
        });

        return sendResponse(res, 200, "Mở khóa sự kiện thành công", result);
    });

    // Hủy sự kiện
    cancelEvent = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminEventService.cancelEvent({
            eventId: id,
        });

        return sendResponse(res, 200, "Hủy sự kiện thành công", result);
    });
}

module.exports = new AdminEventController();