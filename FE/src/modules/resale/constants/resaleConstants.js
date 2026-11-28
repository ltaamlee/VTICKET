export const RESALE_STATUS = {
    AVAILABLE: {
        label: "Đang bán",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    RESERVED: {
        label: "Đang giữ",
        className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    SOLD: {
        label: "Đã bán",
        className: "bg-gray-100 text-gray-600 border-gray-200",
    },
    CANCELLED: {
        label: "Đã hủy",
        className: "bg-rose-50 text-rose-700 border-rose-200",
    },
    EXPIRED: {
        label: "Đã hết hạn",
        className: "bg-rose-50 text-rose-700 border-rose-200",
    },
};

export const RESALE_STATUS_TABS = [
    { key: "all", label: "Tất cả" },
    { key: "AVAILABLE", label: "Đang bán" },
    { key: "SOLD", label: "Đã bán" },
    { key: "CANCELLED", label: "Đã hủy" },
];

export const RESALE_MAX_PRICE = 1_000_000_000;

export function getResaleStatus(status) {
    return (
        RESALE_STATUS[status] || {
            label: status || "Không rõ",
            className: "bg-gray-100 text-gray-600 border-gray-200",
        }
    );
}

/**
 * Lấy thời điểm diễn ra của vé (ưu tiên suất diễn, sau đó tới sự kiện).
 */
export function getResaleEventDate(listing) {
    const ticket = listing?.ticket;
    const session = ticket?.ticketType?.session;
    const event = ticket?.event;

    if (session?.startAt) return new Date(session.startAt);
    if (event?.startAt) return new Date(event.startAt);
    return null;
}

/**
 * So sánh giá bán lại với giá gốc để hiển thị mức chênh lệch.
 */
export function getResalePriceDiff(listing) {
    const originalPrice = Number(listing?.ticket?.ticketType?.price);
    const resalePrice = Number(listing?.price);

    if (!Number.isFinite(originalPrice) || originalPrice <= 0) return null;
    if (!Number.isFinite(resalePrice)) return null;

    const diff = resalePrice - originalPrice;
    const percent = Math.round((diff / originalPrice) * 100);

    return { diff, percent, isCheaper: diff < 0 };
}

export function formatResalePrice(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}
