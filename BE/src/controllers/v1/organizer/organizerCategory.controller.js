const adminCategoryService = require("../../../services/admin/adminCategory.service")
const asyncHandler = require("../../../utils/asyncHandler");

class OrganizerCategoryController{
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
}

module.exports = new OrganizerCategoryController();