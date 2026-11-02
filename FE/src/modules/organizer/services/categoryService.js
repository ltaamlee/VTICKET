import { apiRequest } from "../../../services/api";

export function getCategories() {
    return apiRequest("/organizer/categories", {
        method: "GET",
    });
}