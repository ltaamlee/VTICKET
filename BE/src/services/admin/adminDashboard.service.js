const prisma = require("../../config/prisma");
const { parseDateRange, toVnDateString } = require("../../utils/dateRange");

class AdminDashboardService {
    /**
     * Get overview statistics for admin dashboard
     */
    getOverview = async ({ page = 1, pageSize = 10, startDate, endDate } = {}) => {
        const currentPage = Math.max(1, Math.floor(Number(page) || 1));
        const currentPageSize = Math.min(
            100,
            Math.max(1, Math.floor(Number(pageSize) || 10))
        );
        const range = parseDateRange(startDate, endDate, 7);

        const [
            totalUsers,
            totalEvents,
            totalOrders,
            totalRevenue,
            successfulPayments,
            recentEvents,
            recentEventCount,
        ] = await Promise.all([
            prisma.user.count(),

            prisma.event.count(),

            prisma.order.count({
                where: {
                    createdAt: { gte: range.rangeStart, lte: range.rangeEnd },
                },
            }),

            prisma.payment.aggregate({
                where: {
                    status: "SUCCESS",
                    paidAt: { gte: range.rangeStart, lte: range.rangeEnd },
                },
                _sum: { amount: true },
            }),

            prisma.payment.findMany({
                where: {
                    status: "SUCCESS",
                    paidAt: { gte: range.rangeStart, lte: range.rangeEnd },
                },
                select: { amount: true, paidAt: true },
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

        const revenueByDay = range.days.map((date) => ({ date, revenue: 0 }));
        const revenueByDate = new Map(revenueByDay.map((entry) => [entry.date, entry]));
        for (const payment of successfulPayments) {
            if (!payment.paidAt) continue;
            const date = toVnDateString(payment.paidAt);
            const entry = revenueByDate.get(date);
            if (entry) entry.revenue += payment.amount || 0;
        }

        return {
            statistics: {
                totalUsers,
                totalEvents,
                totalOrders,
                totalRevenue: totalRevenue._sum.amount || 0,
            },
            dateRange: {
                startDate: range.startDate,
                endDate: range.endDate,
            },
            revenueByDay,
            recentEvents,
            pagination: {
                currentPage,
                pageSize: currentPageSize,
                totalItems: recentEventCount,
                totalPages: Math.ceil(recentEventCount / currentPageSize),
            },
        };
    };

    getDashboardData = async (params) => {
        return this.getOverview(params);
    };
}

module.exports = new AdminDashboardService();