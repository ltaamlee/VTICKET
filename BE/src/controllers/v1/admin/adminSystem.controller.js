/*
    Cấu hình cổng thanh toán: Môi trường, các cổng thanh toán: Momo, VNPay, PayOS
    Tỷ lệ phí sàn: Default 2%
    Phân trang
    Roll Base Access
*/

const adminSystemService = require('../../../services/admin/adminSystem.service');
const asyncHandler = require('../../../utils/asyncHandler');

class AdminSystemController {
    constructor(service = adminSystemService) {
        this.adminSystemService = service;
    }

    getSettings = asyncHandler ( async (req, res) => {
        const result = await adminSystemService.getSettings()

        return res.status(200).json({
            success: true,
            message: "Lấy cấu hình hệ thống thành công",
            data: result,
        });
    });

    getSetting = asyncHandler (async (req, res) => {
        const { key } = req.params; 

        const result = await adminSystemService.getSetting(key)

        return res.status(200).json({
            success: true,
            message: "Cấu hình theo key thành công",
            data: result,
        });
    });
}
