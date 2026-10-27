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

    getUserDetail = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminUserService.getUserDetail({
            userId: id,
        });

        return res.status(200).json({
            success: true,
            message: "Xem chi tiết tài khoản thành công",
            data: result,
        });
    });

    updateUser = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminUserService.updateUser({
            userId: id,
            ...req.body,
        });

        return res.status(200).json({
            success: true,
            message: "Cập nhật thông tin người dùng thành công",
            data: result,
        })
    })

    deleteUser = asyncHandler(async (req, res) => {
        const { id } = req.params;

        await this.adminUserService.deleteUser({
            userId: id,
        });

        return res.status(200).json({
            success: true,
            message: "Xóa người dùng thành công",
        });
    });
}

module.exports = new AdminUserController();
