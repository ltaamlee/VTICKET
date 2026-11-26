const prisma = require("../config/prisma");
const { EventStatus } = require("@prisma/client");

const EventStatusValues = Object.values(EventStatus);

// Kiểm tra trạng thái hợp lệ
const isValidEventStatus = (
    status,
    allowedStatuses = EventStatusValues
) => {
    return allowedStatuses.includes(status);
};

// Tự động chuyển các sự kiện đã duyệt nhưng đã qua thời gian kết thúc sang COMPLETED
const syncCompletedEvents = async () => {
    const result = await prisma.event.updateMany({
        where: {
            status: EventStatus.APPROVED,
            endAt: { lte: new Date() },
        },
        data: {
            status: EventStatus.COMPLETED,
        },
    });
    return result.count;
};

// Thống kê số lượng Event theo trạng thái
const getEventStatus = async (where = {}) => {
    await syncCompletedEvents();
    const [totalEvents, ...counts] = await Promise.all([
        prisma.event.count({ where }),

        ...EventStatusValues.map((status) =>
            prisma.event.count({
                where: {
                    ...where,
                    status,
                },
            })
        ),
    ]);

    const stats = {
        totalEvents,
    };

    EventStatusValues.forEach((status, index) => {
        stats[`${status.toLowerCase()}Events`] = counts[index];
    });

    return stats;
};

module.exports = {
    EventStatus,
    EventStatusValues,
    isValidEventStatus,
    getEventStatus,
    syncCompletedEvents,
};