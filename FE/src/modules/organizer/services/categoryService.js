import { apiRequest } from "../../../services/api";

export function getCategories({ page = 1 } = {}) {
    const params = new URLSearchParams({ page: String(page) });

    return apiRequest(`/organizer/categories?${params.toString()}`, {
        method: "GET",
    });
}