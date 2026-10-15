const adminDashboardService = require('../../../services/admin/adminDashboard.service'
);
class AdminDashboardController {
  async getDashboardData(req, res, next) {
    try {   
    const dashboardData = await adminDashboardService.getDashboardData();
    res.status(200).json({
      success: true,
        message: 'Lấy dữ liệu dashboard thành công',
        data: dashboardData,
    });
    }
    catch (error) {
      next(error);
    }
    };
}

module.exports = new AdminDashboardController();