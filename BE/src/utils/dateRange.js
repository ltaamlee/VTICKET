const { BadRequestException } = require("../exceptions");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TZ = "Asia/Ho_Chi_Minh";

function toVnDateString(date) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

function addDays(dateStr, days) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days));
    return dt.toISOString().slice(0, 10);
}

function parseDateRange(startDateParam, endDateParam, defaultDays = 7) {
    const today = toVnDateString(new Date());
    const endDate = endDateParam ? String(endDateParam).trim() : today;
    const startDate = startDateParam
        ? String(startDateParam).trim()
        : addDays(endDate, -(defaultDays - 1));

    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
        throw new BadRequestException("Định dạng ngày không hợp lệ (YYYY-MM-DD)");
    }

    const rangeStart = new Date(`${startDate}T00:00:00.000+07:00`);
    const rangeEnd = new Date(`${endDate}T23:59:59.999+07:00`);

    if (
        Number.isNaN(rangeStart.getTime()) ||
        Number.isNaN(rangeEnd.getTime()) ||
        toVnDateString(rangeStart) !== startDate ||
        toVnDateString(rangeEnd) !== endDate
    ) {
        throw new BadRequestException("Ngày không hợp lệ");
    }

    if (rangeStart > rangeEnd) {
        throw new BadRequestException("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
    }

    const dayCount = Math.round((rangeEnd.getTime() - rangeStart.getTime() + 1) / 86400000);
    if (dayCount > 366) {
        throw new BadRequestException("Khoảng thời gian tối đa là 366 ngày");
    }

    const days = Array.from({ length: dayCount }, (_, idx) => addDays(startDate, idx));

    return { startDate, endDate, rangeStart, rangeEnd, days };
}

module.exports = { parseDateRange, toVnDateString };
