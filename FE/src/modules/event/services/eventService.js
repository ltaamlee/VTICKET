import { apiRequest } from "../../../services/api";

/**
 * Service API cho phân hệ sự kiện công khai (Public Events)
 */

/**
 * Lấy danh sách sự kiện kèm bộ lọc, tìm kiếm, phân trang và sắp xếp
 * @param {Object} queryParams 
 * @returns {Promise<Object>}
 */
export async function getEvents(queryParams = {}) {
    const params = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/events?${queryString}` : "/events";

    return apiRequest(endpoint, {
        method: "GET",
    });
}

/**
 * Lấy thông tin chi tiết một sự kiện theo ID (ObjectId) hoặc Slug
 * @param {string} idOrSlug 
 * @returns {Promise<Object>}
 */
export async function getEventDetail(idOrSlug) {
    if (!idOrSlug) {
        throw new Error("Mã sự kiện không hợp lệ");
    }

    return apiRequest(`/events/${encodeURIComponent(idOrSlug)}`, {
        method: "GET",
    });
}

/**
 * Lấy danh sách sự kiện nổi bật (phục vụ Hero / Banner / Trang chủ)
 * @param {number} limit 
 * @returns {Promise<Object>}
 */
export async function getFeaturedEvents(limit = 6) {
    return apiRequest(`/events/featured?limit=${limit}`, {
        method: "GET",
    });
}

/**
 * Lấy danh sách sự kiện sắp diễn ra
 * @param {number} limit 
 * @returns {Promise<Object>}
 */
export async function getUpcomingEvents(limit = 8) {
    return apiRequest(`/events/upcoming?limit=${limit}`, {
        method: "GET",
    });
}

/**
 * Lấy danh sách danh mục phục vụ bộ lọc tìm kiếm
 * @returns {Promise<Object>}
 */
export async function getCategories() {
    return apiRequest("/categories", {
        method: "GET",
    });
}

