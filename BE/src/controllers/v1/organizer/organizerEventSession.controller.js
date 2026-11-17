const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");
const eventSessionService = require("../../../services/organizer/eventSession.service");

/**
 * EventSessionController - Bộ điều khiển HTTP cho suất diễn sự kiện
 * Áp dụng nguyên lý Single Responsibility (SRP) và Dependency Injection trong OOP.
 */
class EventSessionController {
    constructor(service = eventSessionService) {
        this.eventSessionService = service;
    }

    /**
     * Lấy danh sách suất diễn của một sự kiện
     * GET /api/v1/organizer/events/:eventId/sessions
     */
    getSessions = asyncHandler(async (req, res) => {
        const { eventId } = req.params;
        const result = await this.eventSessionService.getSessionsByEventId(
            eventId
        );
        return sendResponse(
            res,
            200,
            "Lấy danh sách suất diễn thành công",
            result
        );
    });

    /**
     * Lấy chi tiết suất diễn
     * GET /api/v1/organizer/events/:eventId/sessions/:sessionId
     */
    getSessionDetail = asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const result = await this.eventSessionService.getSessionById(sessionId);
        return sendResponse(
            res,
            200,
            "Lấy chi tiết suất diễn thành công",
            result
        );
    });

    /**
     * Tạo mới suất diễn
     * POST /api/v1/organizer/events/:eventId/sessions
     */
    createSession = asyncHandler(async (req, res) => {
        const { eventId } = req.params;
        const { startAt, endAt, saleStartAt, saleEndAt } = req.body;

        if (!startAt || !endAt) {
            return sendResponse(
                res,
                400,
                "Vui lòng cung cấp thời gian bắt đầu và kết thúc"
            );
        }

        const result = await this.eventSessionService.createSession(eventId, {
            startAt,
            endAt,
            saleStartAt,
            saleEndAt,
        });

        return sendResponse(
            res,
            201,
            "Tạo suất diễn thành công",
            result
        );
    });

    /**
     * Cập nhật suất diễn
     * PATCH /api/v1/organizer/events/:eventId/sessions/:sessionId
     */
    updateSession = asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const { startAt, endAt, saleStartAt, saleEndAt } = req.body;

        const result = await this.eventSessionService.updateSession(sessionId, {
            startAt,
            endAt,
            saleStartAt,
            saleEndAt,
        });

        return sendResponse(
            res,
            200,
            "Cập nhật suất diễn thành công",
            result
        );
    });

    /**
     * Xóa suất diễn
     * DELETE /api/v1/organizer/events/:eventId/sessions/:sessionId
     */
    deleteSession = asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const result = await this.eventSessionService.deleteSession(sessionId);
        return sendResponse(
            res,
            200,
            "Xóa suất diễn thành công",
            result
        );
    });

    /**
     * Kiểm tra xung đột thời gian
     * POST /api/v1/organizer/events/:eventId/sessions/check-conflict
     */
    checkTimeConflict = asyncHandler(async (req, res) => {
        const { eventId } = req.params;
        const { startAt, endAt, excludeSessionId } = req.body;

        if (!startAt || !endAt) {
            return sendResponse(
                res,
                400,
                "Vui lòng cung cấp thời gian bắt đầu và kết thúc"
            );
        }

        const hasConflict =
            await this.eventSessionService.checkTimeConflict(
                eventId,
                startAt,
                endAt,
                excludeSessionId
            );

        return sendResponse(res, 200, "Kiểm tra xung đột thành công", {
            hasConflict,
        });
    });
}

module.exports = new EventSessionController();
