const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");

const organizerSeatMapService = require("../../../services/organizer/organizerSeatMap.service");

class OrganizerSeatMapController {
    constructor(service = organizerSeatMapService) {
        this.organizerSeatMapService = service;
    }

    getSeatMaps = asyncHandler(async (req, res) => {
        const { keyword = "" } = req.query;

        const result = await this.organizerSeatMapService.getSeatMaps({
            organizerId: req.user.id,
            keyword,
        });

        return sendResponse(
            res,
            200,
            "Lấy danh sách sơ đồ sự kiện thành công",
            { seatMaps: result }
        );
    });

    getSeatMapDetail = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.organizerSeatMapService.getSeatMapDetail({
            seatMapId: id,
            organizerId: req.user.id,
        });

        return sendResponse(
            res,
            200,
            "Xem chi tiết sơ đồ sự kiện thành công",
            result
        );
    });

    createSeatMap = asyncHandler(async (req, res) => {
        const { name, status, zones, canvasWidth, canvasHeight } = req.body;

        const result = await this.organizerSeatMapService.createSeatMap({
            organizerId: req.user.id,
            name,
            status,
            zones,
            canvasWidth,
            canvasHeight,
        });

        return sendResponse(
            res,
            201,
            "Tạo sơ đồ ghế thành công",
            result
        );
    });

    updateSeatMap = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name, status, zones, canvasWidth, canvasHeight } = req.body;

        const result = await this.organizerSeatMapService.updateSeatMap({
            seatMapId: id,
            organizerId: req.user.id,
            name,
            status,
            zones,
            canvasWidth,
            canvasHeight,
        });

        return sendResponse(
            res,
            200,
            "Cập nhật sơ đồ ghế thành công",
            result
        );
    });

    duplicateSeatMap = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name } = req.body || {};

        const result =
            await this.organizerSeatMapService.duplicateSeatMap({
                seatMapId: id,
                organizerId: req.user.id,
                name,
            });

        return sendResponse(
            res,
            201,
            "Nhân bản sơ đồ ghế thành công",
            result
        );
    });

    deleteSeatMap = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.organizerSeatMapService.deleteSeatMap({
            seatMapId: id,
            organizerId: req.user.id,
        });

        return sendResponse(
            res,
            200,
            "Xóa sơ đồ ghế thành công",
            result
        );
    });
}

module.exports = new OrganizerSeatMapController();
