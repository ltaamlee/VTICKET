const prisma = require("../../config/prisma");
const categoryService = require("../public/category.service");

class OrganizerCategoryService {
    async getCategories(params) {
        return categoryService.getCategories(params);
    }
}

module.exports = new OrganizerCategoryService();