import { apiRequest } from "../../../services/api";

/**
 * Service API cho phân hệ vé bán lại (Resale)
 */

/**
 * Lấy danh sách vé đang được bán lại (public)
 * @param {Object} queryParams - { page, pageSize, eventId, keyword }
 */
export function listResaleListings(queryParams = {}) {
    const params = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/resales?${queryString}` : "/resales";

    return apiRequest(endpoint, { method: "GET" });
}

/**
 * Lấy danh sách sự kiện đang có vé bán lại (public)
 * Trả về các card sự kiện kèm số vé bán lại và giá thấp nhất.
 * @param {Object} queryParams - { page, pageSize, keyword, categoryId, sortBy, sortOrder }
 */
export function listResaleEvents(queryParams = {}) {
    const params = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/resales/events?${queryString}` : "/resales/events";

    return apiRequest(endpoint, { method: "GET" });
}

/**
 * Lấy chi tiết một tin bán vé (public)
 * @param {string} id
 */
export function getResaleListing(id) {
    return apiRequest(`/resales/${encodeURIComponent(id)}`, { method: "GET" });
}

/**
 * Lấy các vé của tôi có thể đăng bán lại
 * @param {Object} queryParams - { page, pageSize }
 */
export function listMySellableTickets(queryParams = {}) {
    const params = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/resales/tickets/mine?${queryString}` : "/resales/tickets/mine";

    return apiRequest(endpoint, { method: "GET" });
}

/**
 * Lấy toàn bộ vé đang sở hữu kèm trạng thái bán lại (để hiển thị ở trang "Vé của tôi")
 * @param {Object} queryParams - { page, pageSize }
 */
export function listMyOwnedTickets(queryParams = {}) {
    const params = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/resales/tickets/owned?${queryString}` : "/resales/tickets/owned";

    return apiRequest(endpoint, { method: "GET" });
}

/**
 * Lấy danh sách tin bán của tôi
 * @param {Object} queryParams - { page, pageSize }
 */
export function listMyResales(queryParams = {}) {
    const params = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/resales/mine?${queryString}` : "/resales/mine";

    return apiRequest(endpoint, { method: "GET" });
}

/**
 * Lấy danh sách vé tôi đã mua lại
 * @param {Object} queryParams - { page, pageSize }
 */
export function listMyPurchases(queryParams = {}) {
    const params = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/resales/purchases?${queryString}` : "/resales/purchases";

    return apiRequest(endpoint, { method: "GET" });
}

/**
 * Đăng tin bán vé
 * @param {Object} payload - { ticketId, price }
 */
export function createResaleListing(payload) {
    return apiRequest("/resales", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * Hủy tin bán vé
 * @param {string} id
 */
export function cancelResaleListing(id) {
    return apiRequest(`/resales/${encodeURIComponent(id)}/cancel`, {
        method: "POST",
    });
}

/**
 * Tạo đơn mua vé bán lại (chưa thanh toán)
 * @param {string} id - ID tin bán
 * @param {Object} options - { method: "SEPAY" | "WALLET" }
 */
export function purchaseResaleListing(id, options = {}) {
    return apiRequest(`/resales/${encodeURIComponent(id)}/purchase`, {
        method: "POST",
        body: JSON.stringify(options),
    });
}

/**
 * Lấy chi tiết đơn mua vé bán lại
 * @param {string} orderId
 */
export function getResalePurchaseOrder(orderId) {
    return apiRequest(`/resales/orders/${encodeURIComponent(orderId)}`, {
        method: "GET",
    });
}

/**
 * Khởi tạo thanh toán đơn mua vé bán lại qua cổng SePay
 * @param {string} orderId
 */
export function checkoutResalePurchaseOrder(orderId) {
    return apiRequest(`/resales/orders/${encodeURIComponent(orderId)}/checkout`, {
        method: "POST",
    });
}

/**
 * Thanh toán đơn mua vé bán lại bằng số dư ví điện tử
 * @param {string} orderId
 */
export function payResalePurchaseOrderWithWallet(orderId) {
    return apiRequest(`/resales/orders/${encodeURIComponent(orderId)}/pay-wallet`, {
        method: "POST",
    });
}

/**
 * Hủy đơn mua vé bán lại
 * @param {string} orderId
 */
export function cancelResalePurchaseOrder(orderId) {
    return apiRequest(`/resales/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: "POST",
    });
}
