const asyncHandler = require('../../../utils/asyncHandler');
const sendResponse = require('../../../utils/sendResponse');

const organizerCategoryService = require('../../../services/organizer/organizerCategory.service');

class OrganizerCategoryController {
    constructor(service = organizerCategoryService) {
        this.organizerCategoryService = service;
    }

    getCategories = asyncHandler(async (req, res) => {
        const { page = 1 } = req.query;
        const result = await this.organizerCategoryService.getCategories({
            page,
        });
        return sendResponse(res, 200, 'Lấy danh sách danh mục thành công', result);
    });
}

module.exports = new OrganizerCategoryController();