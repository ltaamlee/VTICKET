const prisma = require("../../config/prisma");

class AdminDashboardService {
    /**
     * Get overview statistics for admin dashboard
     */
    getOverview = async ({ page = 1, pageSize = 10 } = {}) => {
        const currentPage = Math.max(1, Math.floor(Number(page) || 1));
        const currentPageSize = Math.min(
            100,
            Math.max(1, Math.floor(Number(pageSize) || 10))
        );
        const [
            totalUsers,
            totalEvents,
            totalOrders,
            totalRevenue,
            recentEvents,
            recentEventCount,
        ] = await Promise.all([
            prisma.user.count(),

            prisma.event.count(),

            prisma.order.count(),

            prisma.payment.aggregate({
                where: { status: "SUCCESS" },
                _sum: { amount: true },
            }),

            prisma.event.findMany({
                skip: (currentPage - 1) * currentPageSize,
                take: currentPageSize,
                orderBy: {
                    createdAt: "desc",
                },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    startAt: true,
                    createdAt: true,
                    organizer: {
                        select: {
                            profile: { select: { fullName: true } },
                            email: true,
                        },
                    },
                    _count: { select: { tickets: true } },
                },
            }),
            prisma.event.count(),
        ]);

        return {
            statistics: {
                totalUsers,
                totalEvents,
                totalOrders,
                totalRevenue: totalRevenue._sum.amount || 0,
            },
            recentEvents,
            pagination: {
                currentPage,
                pageSize: currentPageSize,
                totalItems: recentEventCount,
                totalPages: Math.ceil(recentEventCount / currentPageSize),
            },
        };
    };

    getDashboardData = async (pagination) => {
        return this.getOverview(pagination);
    };
}

module.exports = new AdminDashboardService();