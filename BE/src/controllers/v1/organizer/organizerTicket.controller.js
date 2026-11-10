const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");

const organizerTicketService = require("../../../services/organizer/organizerTicket.service");

class OrganizerTicketController {
    getTicketTypes = asyncHandler(async (req, res) => {
        const result = await organizerTicketService.getTicketTypes({
            eventId: req.params.eventId,
            organizerId: req.user.id,
        });

        return sendResponse(res, 200, "Lấy danh sách loại vé thành công", {
            ticketTypes: result,
        });
    });

    getEventTicketStats = asyncHandler(async (req, res) => {
        const result = await organizerTicketService.getEventTicketStats({
            eventId: req.params.eventId,
            organizerId: req.user.id,
        });

        return sendResponse(res, 200, "Lấy thống kê vé thành công", result);
    });

    getEventTickets = asyncHandler(async (req, res) => {
        const { page = 1, pageSize = 20, keyword = "", status = "" } =
            req.query;

        const result = await organizerTicketService.getEventTickets({
            eventId: req.params.eventId,
            organizerId: req.user.id,
            page,
            pageSize,
            keyword,
            status,
        });

        return sendResponse(res, 200, "Lấy danh sách vé thành công", result);
    });

    getTicketDetail = asyncHandler(async (req, res) => {
        const result = await organizerTicketService.getTicketDetail({
            ticketId: req.params.id,
            organizerId: req.user.id,
        });

        return sendResponse(res, 200, "Lấy thông tin vé thành công", result);
    });

    checkInTicket = asyncHandler(async (req, res) => {
        const result = await organizerTicketService.checkInTicket({
            ticketId: req.params.id,
            organizerId: req.user.id,
        });

        return sendResponse(res, 200, "Check-in vé thành công", result);
    });
}

module.exports = new OrganizerTicketController();