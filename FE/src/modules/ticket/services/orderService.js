import { apiRequest } from "../../../services/api";

export function startBookingSession(eventId) {
    return apiRequest("/orders/booking-session", { method: "POST", body: JSON.stringify({ eventId }) });
}

export function createOrder(data) {
    return apiRequest("/orders", { method: "POST", body: JSON.stringify(data) });
}

export function getOrder(id) {
    return apiRequest(`/orders/${encodeURIComponent(id)}`);
}

export function cancelOrder(id) {
    return apiRequest(`/orders/${encodeURIComponent(id)}/cancel`, { method: "POST" });
}

export function listOrders(page = 1) {
    return apiRequest(`/orders?page=${encodeURIComponent(page)}`);
}

export function createCheckout(id) {
    return apiRequest(`/orders/${encodeURIComponent(id)}/checkout`, { method: "POST" });
}
