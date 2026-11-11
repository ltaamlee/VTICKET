import { apiRequest } from "../../../services/api";

function buildQuery(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "" || value === false) {
            return;
        }
        searchParams.append(key, String(value));
    });
    const query = searchParams.toString();
    return query ? `?${query}` : "";
}

export function getTaggableEvents({ keyword = "", limit = 30 } = {}) {
    const query = buildQuery({
        keyword: keyword.trim(),
        limit,
    });

    return apiRequest(`/forum/events${query}`, {
        method: "GET",
    });
}

export function getPosts({
    page = 1,
    limit = 10,
    keyword = "",
    eventId = "",
    mine = false,
    sortBy = "newest",
} = {}) {
    const query = buildQuery({
        page,
        limit,
        keyword: keyword.trim(),
        eventId,
        mine: mine ? "true" : "",
        sortBy,
    });

    return apiRequest(`/forum/posts${query}`, {
        method: "GET",
    });
}

export function getPostDetail(postId) {
    return apiRequest(`/forum/posts/${postId}`, {
        method: "GET",
    });
}

export function createPost({ title, content, eventId = null }) {
    return apiRequest("/forum/posts", {
        method: "POST",
        body: JSON.stringify({
            title,
            content,
            eventId: eventId || null,
        }),
    });
}

export function updatePost(postId, { title, content, eventId = null }) {
    return apiRequest(`/forum/posts/${postId}`, {
        method: "PUT",
        body: JSON.stringify({
            title,
            content,
            eventId: eventId || null,
        }),
    });
}

export function deletePost(postId) {
    return apiRequest(`/forum/posts/${postId}`, {
        method: "DELETE",
    });
}

export function createComment(postId, { content, parentId = null }) {
    return apiRequest(`/forum/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({
            content,
            parentId: parentId || null,
        }),
    });
}

export function updateComment(commentId, { content }) {
    return apiRequest(`/forum/comments/${commentId}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
    });
}

export function deleteComment(commentId) {
    return apiRequest(`/forum/comments/${commentId}`, {
        method: "DELETE",
    });
}

export function toggleReaction(postId, type) {
    return apiRequest(`/forum/posts/${postId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ type }),
    });
}
