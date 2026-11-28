import { apiRequest } from "../../../services/api";

/**
 * Danh sách thông báo của người dùng.
 * @param {Object} params - { page, pageSize, status }
 */
export function getNotifications({ page = 1, pageSize = 20, status } = {}) {
    const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });

    if (status) query.append("status", status);

    return apiRequest(`/notifications?${query.toString()}`, {
        method: "GET",
    });
}

/**
 * Số thông báo chưa đọc.
 */
export function getUnreadCount() {
    return apiRequest("/notifications/unread-count", {
        method: "GET",
    });
}

/**
 * Đánh dấu một thông báo đã đọc.
 */
export function markAsRead(id) {
    return apiRequest(`/notifications/${id}/read`, {
        method: "PATCH",
    });
}

/**
 * Đánh dấu toàn bộ thông báo đã đọc.
 */
export function markAllAsRead() {
    return apiRequest("/notifications/read-all", {
        method: "PATCH",
    });
}

/**
 * Xóa một thông báo.
 */
export function deleteNotification(id) {
    return apiRequest(`/notifications/${id}`, {
        method: "DELETE",
    });
}

/**
 * Xóa toàn bộ thông báo đã đọc.
 */
export function clearReadNotifications() {
    return apiRequest("/notifications/read-all", {
        method: "DELETE",
    });
}
