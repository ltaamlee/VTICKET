const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");
const categoryService = require("../../../services/public/category.service");

class CategoryController {
    constructor(service = categoryService) {
        this.categoryService = service;
    }

    getCategories = asyncHandler(async (req, res) => {
        const result = await this.categoryService.getCategories(req.query);
        return sendResponse(res, 200, "Lấy danh sách danh mục thành công", result);
    });
}

module.exports = new CategoryController();
