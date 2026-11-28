const crypto = require("node:crypto");

function generateOrderCode(date) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date).map(({ type, value }) => [type, value]));
    const timestamp = `${parts.day}${parts.month}${parts.year}${parts.hour}${parts.minute}${parts.second}`;
    return `VTK-${timestamp}-${String(crypto.randomInt(1_000_000)).padStart(6, "0")}`;
}

module.exports = generateOrderCode;
