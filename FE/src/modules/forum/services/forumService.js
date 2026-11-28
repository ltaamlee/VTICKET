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

export function getMyActivity({ limit = 30 } = {}) {
    const query = buildQuery({ limit });
    return apiRequest(`/forum/activity${query}`, {
        method: "GET",
    });
}

export function uploadForumImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "forum");
    return apiRequest("/upload/image", {
        method: "POST",
        body: formData,
    });
}

export function getPosts({
    page = 1,
    limit = 10,
    keyword = "",
    eventId = "",
    mine = false,
    liked = false,
    sortBy = "newest",
} = {}) {
    const query = buildQuery({
        page,
        limit,
        keyword: keyword.trim(),
        eventId,
        mine: mine ? "true" : "",
        liked: liked ? "true" : "",
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

export function createPost({ title, content, eventId = null, mediaUrls = [], gifUrl = null }) {
    return apiRequest("/forum/posts", {
        method: "POST",
        body: JSON.stringify({
            title,
            content,
            eventId: eventId || null,
            mediaUrls,
            gifUrl: gifUrl || null,
        }),
    });
}

export function updatePost(postId, { title, content, eventId = null, mediaUrls, gifUrl }) {
    return apiRequest(`/forum/posts/${postId}`, {
        method: "PUT",
        body: JSON.stringify({
            title,
            content,
            eventId: eventId || null,
            ...(mediaUrls !== undefined ? { mediaUrls } : {}),
            ...(gifUrl !== undefined ? { gifUrl: gifUrl || null } : {}),
        }),
    });
}

export function deletePost(postId) {
    return apiRequest(`/forum/posts/${postId}`, {
        method: "DELETE",
    });
}

export function createComment(postId, { content, parentId = null, mediaUrls = [], gifUrl = null }) {
    return apiRequest(`/forum/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({
            content,
            parentId: parentId || null,
            mediaUrls,
            gifUrl: gifUrl || null,
        }),
    });
}

export function updateComment(commentId, { content, mediaUrls, gifUrl }) {
    return apiRequest(`/forum/comments/${commentId}`, {
        method: "PUT",
        body: JSON.stringify({
            content,
            ...(mediaUrls !== undefined ? { mediaUrls } : {}),
            ...(gifUrl !== undefined ? { gifUrl: gifUrl || null } : {}),
        }),
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
