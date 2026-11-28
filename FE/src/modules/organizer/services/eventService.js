import { apiRequest } from "../../../services/api";

export function getEvents({ page = 1, keyword = "", status = "" } = {}) {
    const params = new URLSearchParams({
        page: String(page),
        keyword,
        status,
    });

    return apiRequest(`/organizer/events?${params.toString()}`, {
        method: "GET",
    });
}

export function getEventStats() {
    return apiRequest("/organizer/events/stats", {
        method: "GET",
    });
}

export function getEventDetail(id) {
    return apiRequest(`/organizer/events/${id}`, {
        method: "GET",
    });
}

export function createEvent(data) {
    return apiRequest("/organizer/events", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateEvent(id, data) {
    return apiRequest(`/organizer/events/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function deleteEvent(id) {
    return apiRequest(`/organizer/events/${id}`, {
        method: "DELETE",
    });
}

export function uploadEventImage(file, folder = "events") {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("folder", folder);

    return apiRequest("/upload/image", {
        method: "POST",
        body: formData,
    });
}

export function submitEvent(id) {
    return apiRequest(`/organizer/events/${id}/submit`, {
        method: "PATCH",
    });
}