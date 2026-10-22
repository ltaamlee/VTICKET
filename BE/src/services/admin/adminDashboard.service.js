const prisma = require("../../config/prisma");

class DashboardService {
  /**
   * Get overview statistics for admin dashboard
   */
  getOverview = async () => {
    const [
      totalUsers,
      totalEvents,
      totalOrders,
      recentEvents,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.event.count(),

      prisma.order.count(),

      prisma.event.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return {
      statistics: {
        totalUsers,
        totalEvents,
        totalOrders,
      },
      recentEvents,
    };
  };

  getDashboardData = async () => {
    return this.getOverview();
  };
}

module.exports = new DashboardService();