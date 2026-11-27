import { apiRequest } from "../../../services/api";

export function getDashboardData({ startDate, endDate } = {}) {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const query = params.toString();
    return apiRequest(`/organizer/dashboard${query ? `?${query}` : ""}`, { method: "GET" });
}
