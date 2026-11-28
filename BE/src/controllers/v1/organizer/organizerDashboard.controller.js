const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");
const organizerDashboardService = require("../../../services/organizer/organizerDashboard.service");

class OrganizerDashboardController {
    getDashboardData = asyncHandler(async (req, res) => {
        const result = await organizerDashboardService.getDashboardData(
            req.user.id,
            {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            }
        );

        return sendResponse(res, 200, "Lấy dữ liệu dashboard thành công", result);
    });
}

module.exports = new OrganizerDashboardController();
