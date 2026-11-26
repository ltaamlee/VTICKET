import { apiRequest } from "../../../services/api";

export function getEventTicketStats(eventId) {
    return apiRequest(`/organizer/events/${eventId}/ticket-stats`, {
        method: "GET",
    });
}

export function getEventSessions(eventId) {
    return apiRequest(`/organizer/events/${eventId}/sessions`, {
        method: "GET",
    });
}

export function getEventTickets(
    eventId,
    { page = 1, pageSize = 20, keyword = "", status = "", sessionId = "" } = {}
) {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        keyword,
        status,
    });
    if (sessionId) params.set("sessionId", sessionId);

    return apiRequest(
        `/organizer/events/${eventId}/tickets?${params.toString()}`,
        { method: "GET" }
    );
}

export function getTicketDetail(ticketId) {
    return apiRequest(`/organizer/tickets/${ticketId}`, { method: "GET" });
}

export function checkInTicket(ticketId, sessionId) {
    return apiRequest(`/organizer/tickets/${ticketId}/check-in`, {
        method: "POST",
        body: JSON.stringify({ sessionId }),
    });
}

export function checkInByQr(eventId, { sessionId, qrToken }) {
    return apiRequest(`/organizer/events/${eventId}/check-in`, {
        method: "POST",
        body: JSON.stringify({ sessionId, qrToken }),
    });
}
