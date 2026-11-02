import { apiRequest } from "../../../services/api";

export function getSettings() {
    return apiRequest("/admin/settings", {
        method: "GET",
    });
}


export function getSetting(key) {
    return apiRequest(`/admin/settings/${encodeURIComponent(key)}`, {
        method: "GET",
    });
}

export function updateSettings(key, value) {
    return apiRequest(`/admin/settings/${encodeURIComponent(key)}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
    });
}