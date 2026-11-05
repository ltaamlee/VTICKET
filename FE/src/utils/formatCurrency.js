const VND_FORMATTER = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const VND_FORMATTER_NO_SYMBOL = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
});

export function formatVND(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return VND_FORMATTER.format(0);

    return VND_FORMATTER.format(amount);
}

export function formatVNDNumber(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "0";

    return VND_FORMATTER_NO_SYMBOL.format(amount);
}

export function parseVND(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value !== "string") return 0;

    const digits = value.replace(/[^\d]/g, "");

    if (!digits) return 0;

    const parsed = Number(digits);

    return Number.isFinite(parsed) ? parsed : 0;
}
