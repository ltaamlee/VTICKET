const adminUserService = require("../../../services/admin/adminUser.service");
const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require('../../../utils/sendResponse');

class AdminUserController {
    constructor(service = adminUserService) {
        this.adminUserService = service;
    }

    getUserStats = asyncHandler(async (req, res) => {
        const result = await this.adminUserService.getUserStats();

        return sendResponse(res, 200, "Thống kê tài khoản thành công", result);
    });

    getUsers = asyncHandler(async (req, res) => {
        const { page = 1, keyword = "", role = ""} = req.query;

        const result = await this.adminUserService.getUsers({
            page,
            keyword,
            role,
        });

        return sendResponse(res, 200, "Lấy danh sách người dùng thành công", {
            users: result.users,
            pagination: result.pagination,
        });
    });

    getUserDetail = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminUserService.getUserDetail({
            userId: id,
        });

        return sendResponse(res, 200, "Xem chi tiết tài khoản thành công", result);
    });

    updateUser = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminUserService.updateUser({
            userId: id,
            ...req.body,
        });

        return sendResponse(res, 200, "Cập nhật thông tin người dùng thành công", result);
    })

    deleteUser = asyncHandler(async (req, res) => {
        const { id } = req.params;

        await this.adminUserService.deleteUser({
            userId: id,
        });

        return sendResponse(res, 200, "Xóa người dùng thành công", null);
    });
}

module.exports = new AdminUserController();
