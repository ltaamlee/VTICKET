import { apiRequest } from "../../../services/api";

export function getEventStats() {
    return apiRequest("/admin/event-stats", {
        method: "GET",
    });
}

export function getEvents({
    page = 1,
    keyword = "",
    status = "",
    categoryId = "",
} = {}) {
    const params = new URLSearchParams({
        page,
        keyword,
        status,
        categoryId,
    });

    return apiRequest(`/admin/events?${params.toString()}`, {
        method: "GET",
    });
}

export function getEventDetail(eventId) {
    return apiRequest(`/admin/events/${eventId}`, {
        method: "GET",
    });
}

export function approveEvent(eventId) {
    return apiRequest(`/admin/events/${eventId}/approve`, {
        method: "PATCH",
    });
}

export function rejectEvent(eventId, reason) {
    return apiRequest(`/admin/events/${eventId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
    });
}

export function suspendEvent(eventId) {
    return apiRequest(`/admin/events/${eventId}/suspend`, {
        method: "PATCH",
    });
}

export function restoreEvent(eventId) {
    return apiRequest(`/admin/events/${eventId}/restore`, {
        method: "PATCH",
    });
}

export function cancelEvent(eventId) {
    return apiRequest(`/admin/events/${eventId}/cancel`, {
        method: "PATCH",
    });
}