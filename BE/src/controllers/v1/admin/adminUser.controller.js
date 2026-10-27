const adminUserService = require("../../../services/admin/adminUser.service");
const asyncHandler = require("../../../utils/asyncHandler");

class AdminUserController {
    constructor(service = adminUserService) {
        this.adminUserService = service;
    }

    getUserStats = asyncHandler(async (req, res) => {
        const result = await this.adminUserService.getUserStats();

        return res.status(200).json({
            success: true,
            message: "Thống kê tài khoản thành công",
            data: result,
        });
    });

    getUsers = asyncHandler(async (req, res) => {
        const { page = 1, keyword = "", role = ""} = req.query;

        const result = await this.adminUserService.getUsers({
            page,
            keyword,
            role,
        });

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách người dùng thành công",
            data: result.users,
            pagination: result.pagination,
        });
    });
}

module.exports = new AdminUserController();
