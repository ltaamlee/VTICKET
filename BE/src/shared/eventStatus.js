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

// Thống kê số lượng Event theo trạng thái
const getEventStatus = async (where = {}) => {
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
};