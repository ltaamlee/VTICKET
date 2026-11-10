import { apiRequest } from "../../../services/api";

export function getDashboardData({ page = 1, pageSize = 10 } = {}) {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });

    return apiRequest(`/admin/dashboard?${params.toString()}`, {
        method: "GET",
    });
}
