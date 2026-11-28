import { useCallback, useEffect, useState } from "react";
import { useForumNotice } from "../../forum/hooks/useForumNotice";
import {
    getForumComments,
    getForumPostDetail,
    getForumPosts,
    getForumStats,
    updateForumCommentStatus,
    updateForumPostStatus,
} from "../services/forumService";

export function useAdminForumModeration() {
    const { notice, notify, dismissNotice } = useForumNotice();

    const [activeTab, setActiveTab] = useState("posts");
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("");
    const [eventId, setEventId] = useState("");
    const [postIdFilter, setPostIdFilter] = useState(null);

    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [confirmAction, setConfirmAction] = useState(null);
    const [processing, setProcessing] = useState(false);

    const [detailPostId, setDetailPostId] = useState(null);
    const [detailPost, setDetailPost] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");

    const refreshStats = useCallback(async () => {
        try {
            const res = await getForumStats();
            setStats(res.data || null);
        } catch {
            // Non-blocking stats refresh
        }
    }, []);

    useEffect(() => {
        let active = true;

        const run = async () => {
            try {
                setStatsLoading(true);
                const res = await getForumStats();
                if (active) {
                    setStats(res.data || null);
                }
            } catch {
                // Non-blocking stats load
            } finally {
                if (active) setStatsLoading(false);
            }
        };

        run();
        return () => {
            active = false;
        };
    }, []);

    const fetchListRequest = useCallback(() => {
        if (activeTab === "comments") {
            return getForumComments({
                page,
                limit: 15,
                keyword,
                status,
                postId: postIdFilter?.id || "",
            });
        }

        return getForumPosts({
            page,
            limit: 10,
            keyword,
            status,
            eventId,
        });
    }, [activeTab, page, keyword, status, eventId, postIdFilter]);

    const applyListResponse = useCallback(
        (data) => {
            const pg = data?.pagination || {};
            if (activeTab === "comments") {
                setComments(data?.comments || []);
                setPagination({
                    currentPage: pg.currentPage || page,
                    totalPages: pg.totalPages || 1,
                    totalItems: pg.totalComments ?? 0,
                });
            } else {
                setPosts(data?.posts || []);
                setPagination({
                    currentPage: pg.currentPage || page,
                    totalPages: pg.totalPages || 1,
                    totalItems: pg.totalPosts ?? 0,
                });
            }
        },
        [activeTab, page]
    );

    const refreshList = useCallback(
        async ({ silent = false } = {}) => {
            try {
                if (!silent) setLoading(true);
                setError("");
                const res = await fetchListRequest();
                applyListResponse(res.data);
            } catch (err) {
                setError(err.message || "Không thể tải dữ liệu diễn đàn.");
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [fetchListRequest, applyListResponse]
    );

    useEffect(() => {
        let active = true;

        const run = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await fetchListRequest();
                if (active) {
                    applyListResponse(res.data);
                }
            } catch (err) {
                if (active) {
                    setError(err.message || "Không thể tải dữ liệu diễn đàn.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        run();
        return () => {
            active = false;
        };
    }, [fetchListRequest, applyListResponse]);

    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
        setKeyword("");
        setStatus("");
        setPostIdFilter(null);
        setPage(1);
    }, []);

    const handleKeywordSubmit = useCallback((nextKeyword) => {
        setKeyword(nextKeyword);
        setPage(1);
    }, []);

    const handleStatusChange = useCallback((nextStatus) => {
        setStatus(nextStatus);
        setPage(1);
    }, []);

    const handleEventIdChange = useCallback((nextEventId) => {
        setEventId(nextEventId);
        setPage(1);
    }, []);

    const handleClearPostFilter = useCallback(() => {
        setPostIdFilter(null);
        setPage(1);
    }, []);

    const handleResetFilters = useCallback(() => {
        setKeyword("");
        setStatus("");
        setEventId("");
        setPostIdFilter(null);
        setPage(1);
    }, []);

    const filterCommentsByPost = useCallback((post) => {
        if (!post?.id) return;
        setKeyword("");
        setStatus("");
        setPostIdFilter({ id: post.id, title: post.title });
        setActiveTab("comments");
        setPage(1);
    }, []);

    const loadPostDetail = useCallback(async (postId, { silent = false } = {}) => {
        if (!postId) return;
        try {
            if (!silent) {
                setDetailLoading(true);
                setDetailPost(null);
            }
            setDetailError("");
            const res = await getForumPostDetail(postId);
            setDetailPost(res.data || null);
        } catch (err) {
            setDetailError(err.message || "Không thể tải chi tiết bài viết.");
        } finally {
            if (!silent) setDetailLoading(false);
        }
    }, []);

    const openPostDetail = useCallback(
        (postId) => {
            setDetailPostId(postId);
            loadPostDetail(postId);
        },
        [loadPostDetail]
    );

    const closePostDetail = useCallback(() => {
        setDetailPostId(null);
        setDetailPost(null);
        setDetailError("");
    }, []);

    const requestModeration = useCallback((targetType, item, nextStatus) => {
        setConfirmAction({ targetType, item, nextStatus });
    }, []);

    const closeConfirmAction = useCallback(() => {
        if (!processing) {
            setConfirmAction(null);
        }
    }, [processing]);

    const executeModeration = useCallback(async () => {
        if (!confirmAction || processing) return;

        const { targetType, item, nextStatus } = confirmAction;
        try {
            setProcessing(true);
            if (targetType === "post") {
                await updateForumPostStatus(item.id, nextStatus);
                notify("Đã cập nhật trạng thái bài viết.", "success");
            } else {
                await updateForumCommentStatus(item.id, nextStatus);
                notify("Đã cập nhật trạng thái bình luận.", "success");
            }

            setConfirmAction(null);
            await Promise.all([
                refreshList({ silent: true }),
                refreshStats(),
                detailPostId ? loadPostDetail(detailPostId, { silent: true }) : null,
            ]);
        } catch (err) {
            notify(err.message || "Không thể cập nhật trạng thái.", "error");
        } finally {
            setProcessing(false);
        }
    }, [
        confirmAction,
        processing,
        notify,
        refreshList,
        refreshStats,
        detailPostId,
        loadPostDetail,
    ]);

    return {
        activeTab,
        handleTabChange,
        page,
        setPage,
        keyword,
        status,
        eventId,
        postIdFilter,
        handleKeywordSubmit,
        handleStatusChange,
        handleEventIdChange,
        handleClearPostFilter,
        handleResetFilters,
        filterCommentsByPost,
        stats,
        statsLoading,
        posts,
        comments,
        pagination,
        loading,
        error,
        refreshList,
        notice,
        dismissNotice,
        detailPostId,
        detailPost,
        detailLoading,
        detailError,
        openPostDetail,
        closePostDetail,
        confirmAction,
        processing,
        requestModeration,
        closeConfirmAction,
        executeModeration,
    };
}
