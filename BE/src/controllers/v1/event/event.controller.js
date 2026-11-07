const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");

import eventService from "../../../services/event.service";

class EventController {
    constructor(service = eventService) {
        this.eventService = service;
    }

    getEvents = asyncHandler(async (req, res) => {
        const { page = 1, keyword = "" } = req.query;
        const result = await this.eventService.getEvents({ page, keyword });
        return sendResponse(res, 200, "Lấy danh sách sự kiện thành công", result);
    });

    getEventDetail = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await this.eventService.getEventDetail({ eventId: id });
        return sendResponse(res, 200, "Xem chi tiết sự kiện thành công", result);
    });

}

module.exports = new EventController();