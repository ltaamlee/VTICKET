const prisma = require("../../config/prisma");

class OrganizerDashboardService {
    async getDashboardData(organizerId) {
        if (!organizerId) {
            const error = new Error("Không xác định được tài khoản Ban tổ chức");
            error.statusCode = 401;
            throw error;
        }

        const now = new Date();
        const startDate = new Date(now);
        startDate.setUTCHours(0, 0, 0, 0);
        startDate.setUTCDate(startDate.getUTCDate() - 6);

        const [
            totalEvents,
            upcomingEvents,
            issuedTickets,
            checkedInTickets,
            paidOrderItems,
            recentEvents,
        ] = await Promise.all([
            prisma.event.count({ where: { organizerId } }),
            prisma.event.count({
                where: { organizerId, startAt: { gte: now } },
            }),
            prisma.ticket.count({
                where: {
                    event: { organizerId },
                    status: { in: ["ISSUED", "CHECKED_IN"] },
                },
            }),
            prisma.ticket.count({
                where: { event: { organizerId }, status: "CHECKED_IN" },
            }),
            prisma.orderItem.findMany({
                where: {
                    order: {
                        status: "PAID",
                        payments: {
                            some: {
                                status: "SUCCESS",
                                paidAt: { gte: startDate },
                            },
                        },
                    },
                    ticketType: { event: { organizerId } },
                },
                select: {
                    subtotal: true,
                    createdAt: true,
                    order: {
                        select: {
                            payments: {
                                where: {
                                    status: "SUCCESS",
                                    paidAt: { gte: startDate },
                                },
                                select: { paidAt: true },
                            },
                        },
                    },
                },
            }),
            prisma.event.findMany({
                where: { organizerId },
                take: 5,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    startAt: true,
                    location: true,
                    category: { select: { name: true } },
                    _count: { select: { tickets: true } },
                },
            }),
        ]);

        const revenueByDay = Array.from({ length: 7 }, (_, index) => {
            const day = new Date(startDate);
            day.setUTCDate(startDate.getUTCDate() + index);
            return {
                date: day.toISOString().slice(0, 10),
                revenue: 0,
            };
        });
        const revenueByDate = new Map(
            revenueByDay.map((entry) => [entry.date, entry])
        );

        for (const item of paidOrderItems) {
            const paidAt = item.order.payments[0]?.paidAt || item.createdAt;
            const date = paidAt.toISOString().slice(0, 10);
            const entry = revenueByDate.get(date);
            if (entry) entry.revenue += item.subtotal;
        }

        return {
            statistics: {
                totalEvents,
                upcomingEvents,
                issuedTickets,
                checkedInTickets,
                revenue7Days: paidOrderItems.reduce(
                    (total, item) => total + item.subtotal,
                    0
                ),
            },
            revenueByDay,
            recentEvents,
        };
    }
}

module.exports = new OrganizerDashboardService();
