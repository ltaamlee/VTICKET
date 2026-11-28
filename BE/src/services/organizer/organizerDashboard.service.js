const prisma = require("../../config/prisma");
const { parseDateRange, toVnDateString } = require("../../utils/dateRange");

class OrganizerDashboardService {
    async getDashboardData(organizerId, { startDate, endDate } = {}) {
        if (!organizerId) {
            const error = new Error("Không xác định được tài khoản Ban tổ chức");
            error.statusCode = 401;
            throw error;
        }

        const now = new Date();
        const range = parseDateRange(startDate, endDate, 7);

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
                                paidAt: { gte: range.rangeStart, lte: range.rangeEnd },
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
                                    paidAt: { gte: range.rangeStart, lte: range.rangeEnd },
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
                },
            }),
        ]);

        // Số vé đã bán theo từng sự kiện.
        // _count.tickets trước đây đếm MỌI vé (kể cả CANCELLED/EXPIRED/RESERVED)
        // nên số vé hiển thị theo sự kiện bị sai -> chỉ tính vé đã phát hành.
        const eventIds = recentEvents.map((event) => event.id);
        const soldTicketsByEvent = eventIds.length
            ? await prisma.ticket.groupBy({
                  by: ["eventId"],
                  where: {
                      eventId: { in: eventIds },
                      status: { in: ["ISSUED", "CHECKED_IN"] },
                  },
                  _count: { _all: true },
              })
            : [];
        const soldCountMap = new Map(
            soldTicketsByEvent.map((entry) => [entry.eventId, entry._count._all])
        );

        const revenueByDay = range.days.map((date) => ({
            date,
            revenue: 0,
        }));
        const revenueByDate = new Map(
            revenueByDay.map((entry) => [entry.date, entry])
        );

        for (const item of paidOrderItems) {
            const paidAt = item.order.payments[0]?.paidAt || item.createdAt;
            const date = toVnDateString(paidAt);
            const entry = revenueByDate.get(date);
            if (entry) entry.revenue += item.subtotal;
        }

        const rangeRevenue = paidOrderItems.reduce(
            (total, item) => total + item.subtotal,
            0
        );

        return {
            statistics: {
                totalEvents,
                upcomingEvents,
                issuedTickets,
                checkedInTickets,
                revenue: rangeRevenue,
                revenue7Days: rangeRevenue,
            },
            dateRange: {
                startDate: range.startDate,
                endDate: range.endDate,
            },
            revenueByDay,
            recentEvents: recentEvents.map((event) => ({
                ...event,
                soldTickets: soldCountMap.get(event.id) || 0,
            })),
        };
    }
}

module.exports = new OrganizerDashboardService();
