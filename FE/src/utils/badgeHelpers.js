/**
 * Badge helpers - Các class Tailwind dùng chung cho badge trạng thái.
 * Tách riêng để dùng đồng nhất giữa các modal và bảng.
 */

export function getRoleBadge(role) {
    switch (role) {
        case "ADMIN":
            return "bg-purple-100 text-purple-700";
        case "ORGANIZER":
            return "bg-blue-100 text-blue-700";
        case "USER":
            return "bg-yellow-100 text-yellow-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
}

export function getStatusBadge(status) {
    switch (status) {
        case "ACTIVE":
            return "bg-green-100 text-green-700";
        case "INACTIVE":
            return "bg-yellow-100 text-orange-700";
        case "BANNED":
            return "bg-red-100 text-red-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
}
