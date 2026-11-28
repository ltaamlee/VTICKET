import { apiRequest } from "../../../services/api";

function requestSessionData(endpoint, options) {
    return apiRequest(endpoint, options).then((response) => response?.data);
}

export function getSessionsByEventId(eventId) {
    return requestSessionData(`/organizer/events/${eventId}/sessions`, {
        method: "GET",
    });
}

export function getSessionDetail(eventId, sessionId) {
    return requestSessionData(
        `/organizer/events/${eventId}/sessions/${sessionId}`,
        { method: "GET" }
    );
}

export function createSession(eventId, sessionData) {
    return requestSessionData(`/organizer/events/${eventId}/sessions`, {
        method: "POST",
        body: JSON.stringify(sessionData),
    });
}

export function updateSession(eventId, sessionId, sessionData) {
    return requestSessionData(
        `/organizer/events/${eventId}/sessions/${sessionId}`,
        {
            method: "PATCH",
            body: JSON.stringify(sessionData),
        }
    );
}

export function deleteSession(eventId, sessionId) {
    return requestSessionData(
        `/organizer/events/${eventId}/sessions/${sessionId}`,
        { method: "DELETE" }
    );
}

export function checkTimeConflict(
    eventId,
    startAt,
    endAt,
    excludeSessionId = null
) {
    return requestSessionData(
        `/organizer/events/${eventId}/sessions/check-conflict`,
        {
            method: "POST",
            body: JSON.stringify({ startAt, endAt, excludeSessionId }),
        }
    );
}
