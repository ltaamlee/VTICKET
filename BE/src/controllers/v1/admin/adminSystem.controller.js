/*
    Cấu hình cổng thanh toán: Môi trường, các cổng thanh toán: Momo, VNPay, PayOS
    Tỷ lệ phí sàn: Default 2%
    Phân trang
    Roll Base Access
*/

const adminSystemService = require('../../../services/admin/adminSystem.service');
const asyncHandler = require('../../../utils/asyncHandler');
const sendResponse = require('../../../utils/sendResponse');

class AdminSystemController {
    constructor(service = adminSystemService) {
        this.adminSystemService = service;
    }

    getSettings = asyncHandler(async (req, res) => {
        const result = await this.adminSystemService.getSettings();
        return sendResponse(res, 200, "Lấy cấu hình hệ thống thành công", result);
    });

    getSetting = asyncHandler(async (req, res) => {
        const { key } = req.params;

        const result = await this.adminSystemService.getSetting(key);

        return sendResponse(res, 200, "Cấu hình theo key thành công", result);
    });

    updateSetting = asyncHandler(async (req, res) => {
        const { key } = req.params;
        const { value } = req.body;

        const setting = await this.adminSystemService.updateSetting(
            key,
            value
        );

        return sendResponse(res, 200, "Cập nhật cấu hình thành công", setting.value);
    });
}

module.exports = new AdminSystemController();