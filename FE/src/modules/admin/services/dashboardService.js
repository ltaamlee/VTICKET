import { apiRequest } from "../../../services/api";

export function getDashboardData({ page = 1, pageSize = 10, startDate, endDate } = {}) {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    return apiRequest(`/admin/dashboard?${params.toString()}`, {
        method: "GET",
    });
}
