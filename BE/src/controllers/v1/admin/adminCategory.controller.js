const adminCategoryService = require("../../../services/admin/adminCategory.service")
const asyncHandler = require("../../../utils/asyncHandler");

class AdminCategoryController{
    constructor (service = adminCategoryService){
        this.adminCategoryService = service;
    }

    getCategories = asyncHandler(async (req, res) => {
        const { page = 1, keyword = "", role = ""} = req.query;

        const result = await this.adminCategoryService.getCategories({
            page,
            keyword,
        });

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách danh mục thành công",
            data: result.categories,
            pagination: result.pagination,
        });
    });

    getCategoryDetail = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminCategoryService.getCategoryDetail({
            categoryId: id,
        });

        return res.status(200).json({
            success: true,
            message: "Xem chi tiết danh mục thành công",
            data: result,
        });
    });

    createCategory = asyncHandler(async (req, res) => {
        const { name, slug } = req.body;

        const result = await this.adminCategoryService.createCategory({
            name,
            slug,
        });

        return res.status(201).json({
            success: true,
            message: "Tạo danh mục thành công",
            data: result,
        });
    });

    updateCategory = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminCategoryService.updateCategory({
            categoryId: id,
            ...req.body,
        });

        return res.status(200).json({
            success: true,
            message: "Cập nhật thông tin danh mục thành công",
            data: result,
        })
    })

    deleteCategory = asyncHandler(async (req, res) => {
        const { id } = req.params;

        await this.adminCategoryService.deleteCategory({
            categoryId: id,
        });

        return res.status(200).json({
            success: true,
            message: "Xóa danh mục thành công",
        });
    });
}

module.exports = new AdminCategoryController();