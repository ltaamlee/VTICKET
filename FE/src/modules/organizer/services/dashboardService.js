import { apiRequest } from "../../../services/api";

export function getDashboardData() {
    return apiRequest("/organizer/dashboard", { method: "GET" });
}
