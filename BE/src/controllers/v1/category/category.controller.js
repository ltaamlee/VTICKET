const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");

import categoryService from "../../../services/category.service";

class CategoryController {
    constructor(service = categoryService) {
        this.categoryService = service;
    }

    getCategories = asyncHandler(async (req, res) => {
        const result = await this.categoryService.getCategories();
        return sendResponse(res, 200, "Lấy danh sách danh mục thành công", result);
    });
}

module.exports = new CategoryController();