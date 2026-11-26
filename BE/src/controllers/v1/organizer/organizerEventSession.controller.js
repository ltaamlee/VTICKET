const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");
const eventSessionService = require("../../../services/organizer/organizerEventSession.service");

class EventSessionController {
    constructor(service = eventSessionService) {
        this.eventSessionService = service;
    }

    getSessions = asyncHandler(async (req, res) => {
        const { eventId } = req.params;
        const result = await this.eventSessionService.getSessionsByEventId(
            eventId,
            req.user.id
        );
        return sendResponse(
            res,
            200,
            "Lấy danh sách suất diễn thành công",
            result
        );
    });

    getSessionDetail = asyncHandler(async (req, res) => {
        const { eventId, sessionId } = req.params;
        const result = await this.eventSessionService.getSessionById(
            eventId,
            sessionId,
            req.user.id
        );
        return sendResponse(
            res,
            200,
            "Lấy chi tiết suất diễn thành công",
            result
        );
    });


    createSession = asyncHandler(async (req, res) => {
        const { eventId } = req.params;
        const { startAt, endAt } = req.body;

        if (!startAt || !endAt) {
            return sendResponse(
                res,
                400,
                "Vui lòng cung cấp thời gian bắt đầu và kết thúc"
            );
        }

        const result = await this.eventSessionService.createSession(
            eventId,
            { startAt, endAt },
            req.user.id
        );

        return sendResponse(
            res,
            201,
            "Tạo suất diễn thành công",
            result
        );
    });


    updateSession = asyncHandler(async (req, res) => {
        const { eventId, sessionId } = req.params;
        const { startAt, endAt } = req.body;

        const result = await this.eventSessionService.updateSession(
            eventId,
            sessionId,
            { startAt, endAt },
            req.user.id
        );

        return sendResponse(
            res,
            200,
            "Cập nhật suất diễn thành công",
            result
        );
    });


    deleteSession = asyncHandler(async (req, res) => {
        const { eventId, sessionId } = req.params;
        const result = await this.eventSessionService.deleteSession(
            eventId,
            sessionId,
            req.user.id
        );
        return sendResponse(
            res,
            200,
            "Xóa suất diễn thành công",
            result
        );
    });


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
                excludeSessionId,
                req.user.id
            );

        return sendResponse(res, 200, "Kiểm tra xung đột thành công", {
            hasConflict,
        });
    });
}

module.exports = new EventSessionController();
