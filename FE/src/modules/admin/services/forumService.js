import { apiRequest } from "../../../services/api";

function buildQuery(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }
        searchParams.append(key, String(value));
    });
    const query = searchParams.toString();
    return query ? `?${query}` : "";
}

export function getForumStats() {
    return apiRequest("/admin/forum/stats", {
        method: "GET",
    });
}

export function getForumPosts({
    page = 1,
    limit = 10,
    keyword = "",
    status = "",
    eventId = "",
} = {}) {
    const query = buildQuery({
        page,
        limit,
        keyword: keyword.trim(),
        status,
        eventId,
    });

    return apiRequest(`/admin/forum/posts${query}`, {
        method: "GET",
    });
}

export function getForumPostDetail(postId) {
    return apiRequest(`/admin/forum/posts/${postId}`, {
        method: "GET",
    });
}

export function updateForumPostStatus(postId, status) {
    return apiRequest(`/admin/forum/posts/${postId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}

export function getForumComments({
    page = 1,
    limit = 15,
    keyword = "",
    status = "",
    postId = "",
} = {}) {
    const query = buildQuery({
        page,
        limit,
        keyword: keyword.trim(),
        status,
        postId,
    });

    return apiRequest(`/admin/forum/comments${query}`, {
        method: "GET",
    });
}

export function updateForumCommentStatus(commentId, status) {
    return apiRequest(`/admin/forum/comments/${commentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}

