import { apiRequest } from "../../../services/api";

export function createOrder(data) {
    return apiRequest("/orders", { method: "POST", body: JSON.stringify(data) });
}

export function getOrder(id) {
    return apiRequest(`/orders/${encodeURIComponent(id)}`);
}

export function listOrders(page = 1) {
    return apiRequest(`/orders?page=${encodeURIComponent(page)}`);
}

export function createCheckout(id) {
    return apiRequest(`/orders/${encodeURIComponent(id)}/checkout`, { method: "POST" });
}
