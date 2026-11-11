export const REACTION_OPTIONS = [
    {
        type: "LIKE",
        emoji: "👍",
        label: "Thích",
        activeClass: "border-blue-300 bg-blue-50 text-blue-700",
    },
    {
        type: "LOVE",
        emoji: "❤️",
        label: "Yêu thích",
        activeClass: "border-rose-300 bg-rose-50 text-rose-700",
    },
    {
        type: "HAHA",
        emoji: "😂",
        label: "Haha",
        activeClass: "border-amber-300 bg-amber-50 text-amber-800",
    },
    {
        type: "SAD",
        emoji: "😢",
        label: "Buồn",
        activeClass: "border-sky-300 bg-sky-50 text-sky-800",
    },
    {
        type: "ANGRY",
        emoji: "😡",
        label: "Phẫn nộ",
        activeClass: "border-orange-300 bg-orange-50 text-orange-700",
    },
];

export const REACTION_MAP = Object.fromEntries(
    REACTION_OPTIONS.map((item) => [item.type, item])
);

export const ROLE_BADGES = {
    ADMIN: {
        label: "Quản trị viên",
        className: "bg-red-50 text-red-700 border border-red-200",
    },
    ORGANIZER: {
        label: "Ban tổ chức",
        className: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    },
};

export const SORT_OPTIONS = [
    { value: "newest", label: "Mới nhất" },
    { value: "popular", label: "Nổi bật nhất" },
    { value: "oldest", label: "Cũ nhất" },
];

export function formatRelativeTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return "Vừa xong";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} ngày trước`;

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

export function formatFullDateTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

export function formatShortEventDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

export function getInitials(name) {
    if (!name || typeof name !== "string") return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getEventDetailPath(event) {
    if (!event) return "/events";
    return `/events/${event.slug || event.id}`;
}

export function isEdited(createdAt, updatedAt) {
    if (!createdAt || !updatedAt) return false;
    return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 5000;
}

