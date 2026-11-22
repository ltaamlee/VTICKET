import { apiRequest } from "../../../services/api";

export function getEventTicketStats(eventId) {
    return apiRequest(`/organizer/events/${eventId}/ticket-stats`, {
        method: "GET",
    });
}

export function getEventTickets(
    eventId,
    { page = 1, pageSize = 20, keyword = "", status = "" } = {}
) {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        keyword,
        status,
    });

    return apiRequest(
        `/organizer/events/${eventId}/tickets?${params.toString()}`,
        { method: "GET" }
    );
}

export function getTicketDetail(ticketId) {
    return apiRequest(`/organizer/tickets/${ticketId}`, { method: "GET" });
}

export function checkInTicket(ticketId) {
    return apiRequest(`/organizer/tickets/${ticketId}/check-in`, {
        method: "POST",
    });
}
