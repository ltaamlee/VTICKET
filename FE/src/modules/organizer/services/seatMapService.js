import { apiRequest } from "../../../services/api";

export function getSeatMaps({ keyword = "" } = {}) {
    const params = new URLSearchParams({
        keyword,
    });

    return apiRequest(`/organizer/seat-maps?${params.toString()}`, {
        method: "GET",
    });
}

export function getSeatMapDetail(id) {
    return apiRequest(`/organizer/seat-maps/${id}`, {
        method: "GET",
    });
}

export function createSeatMap(data) {
    return apiRequest("/organizer/seat-maps", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateSeatMap(id, data) {
    return apiRequest(`/organizer/seat-maps/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function duplicateSeatMap(id, data = {}) {
    return apiRequest(`/organizer/seat-maps/${id}/duplicate`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function deleteSeatMap(id) {
    return apiRequest(`/organizer/seat-maps/${id}`, {
        method: "DELETE",
    });
}
