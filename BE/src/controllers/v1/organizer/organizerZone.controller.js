const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");

const organizerZoneService = require("../../../services/organizer/zone/organizerZone.service");

class OrganizerZoneController {
    getZones = asyncHandler(async (req, res) => {
        const result = await organizerZoneService.getZones({
            seatMapId: req.params.seatMapId,
            organizerId: req.user.id,
        });

        return sendResponse(res, 200, "Lấy danh sách khu vực thành công", {
            zones: result,
        });
    });

    getZoneDetail = asyncHandler(async (req, res) => {
        const result = await organizerZoneService.getZoneDetail({
            zoneId: req.params.id,
            organizerId: req.user.id,
        });

        return sendResponse(res, 200, "Lấy chi tiết khu vực thành công", result);
    });

    createZone = asyncHandler(async (req, res) => {
        const result = await organizerZoneService.createZone({
            seatMapId: req.params.seatMapId,
            organizerId: req.user.id,
            zone: req.body.zone || req.body,
        });

        return sendResponse(res, 201, "Tạo khu vực thành công", result);
    });

    updateZone = asyncHandler(async (req, res) => {
        const result = await organizerZoneService.updateZone({
            zoneId: req.params.id,
            organizerId: req.user.id,
            zone: req.body.zone || req.body,
        });

        return sendResponse(res, 200, "Cập nhật khu vực thành công", result);
    });

    deleteZone = asyncHandler(async (req, res) => {
        const result = await organizerZoneService.deleteZone({
            zoneId: req.params.id,
            organizerId: req.user.id,
        });

        return sendResponse(res, 200, "Xóa khu vực thành công", result);
    });
}

module.exports = new OrganizerZoneController();
