const adminCategoryService = require("../../../services/admin/adminCategory.service")
const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require('../../../utils/sendResponse');

class AdminCategoryController{
    constructor (service = adminCategoryService){
        this.adminCategoryService = service;
    }

    // Lấy danh sách danh mục
    getCategories = asyncHandler(async (req, res) => {
        const { page = 1, keyword = "", role = ""} = req.query;

        const result = await this.adminCategoryService.getCategories({
            page,
            keyword,
        });

        return sendResponse(res, 200, "Lấy danh sách danh mục thành công", {
            categories: result.categories,
            pagination: result.pagination,
        });
    });

    // Xem chi tiết danh mục
    getCategoryDetail = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminCategoryService.getCategoryDetail({
            categoryId: id,
        });

        return sendResponse(res, 200, "Xem chi tiết danh mục thành công", result);
    });

    // Tạo danh mục
    createCategory = asyncHandler(async (req, res) => {
        const { name, slug } = req.body;

        const result = await this.adminCategoryService.createCategory({
            name,
            slug,
        });

        return sendResponse(res, 201, "Tạo danh mục thành công", result);
    });

    // Cập nhật danh mục
    updateCategory = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await this.adminCategoryService.updateCategory({
            categoryId: id,
            ...req.body,
        });

        return sendResponse(res, 200, "Cập nhật thông tin danh mục thành công", result);
    })

    // Xóa danh mục
    deleteCategory = asyncHandler(async (req, res) => {
        const { id } = req.params;

        await this.adminCategoryService.deleteCategory({
            categoryId: id,
        });

        return sendResponse(res, 200, "Xóa danh mục thành công", null);
    });
}

module.exports = new AdminCategoryController();