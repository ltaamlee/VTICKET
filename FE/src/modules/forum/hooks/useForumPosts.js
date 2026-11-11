import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
    deletePost,
    getPosts,
    toggleReaction,
} from "../services/forumService";
import { useAuthRedirect } from "./useAuthRedirect";
import { useForumNotice } from "./useForumNotice";

export function useForumPosts({
    page = 1,
    limit = 10,
    keyword = "",
    eventId = "",
    mine = false,
    sortBy = "newest",
    enabled = true,
    onTotalChange,
} = {}) {
    const { isAuthenticated } = useAuth();
    const redirectToLogin = useAuthRedirect();

    const [posts, setPosts] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: page,
        totalPages: 1,
        totalPosts: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { notice, notify, dismissNotice } = useForumNotice();
    const [reactingPostId, setReactingPostId] = useState(null);
    const [deletingPost, setDeletingPost] = useState(null);
    const [deletingLoading, setDeletingLoading] = useState(false);

    const applyPostList = useCallback(
        (data) => {
            const nextPagination = data?.pagination || {
                currentPage: page,
                totalPages: 1,
                totalPosts: 0,
            };
            setPosts(data?.posts || []);
            setPagination(nextPagination);
            onTotalChange?.(nextPagination.totalPosts || 0);
        },
        [page, onTotalChange]
    );

    const executeFetch = useCallback(() => {
        return getPosts({
            page,
            limit,
            keyword,
            eventId,
            mine: isAuthenticated && mine,
            sortBy,
        });
    }, [page, limit, keyword, eventId, mine, sortBy, isAuthenticated]);

    const refreshPosts = useCallback(
        async ({ silent = false } = {}) => {
            if (!enabled) return;
            try {
                if (!silent) setLoading(true);
                setError("");
                const res = await executeFetch();
                applyPostList(res.data);
            } catch (err) {
                setError(err.message || "Không thể tải danh sách bài viết.");
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [enabled, executeFetch, applyPostList]
    );

    useEffect(() => {
        if (!enabled) return;
        let active = true;

        const run = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await executeFetch();
                if (active) {
                    applyPostList(res.data);
                }
            } catch (err) {
                if (active) {
                    setError(err.message || "Không thể tải danh sách bài viết.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        run();
        return () => {
            active = false;
        };
    }, [enabled, executeFetch, applyPostList]);

    const handleReact = useCallback(
        async (postId, type) => {
            if (!isAuthenticated) {
                redirectToLogin();
                return;
            }
            try {
                setReactingPostId(postId);
                const res = await toggleReaction(postId, type);
                const nextReactions = res.data?.reactions;
                if (nextReactions) {
                    setPosts((prev) =>
                        prev.map((item) =>
                            item.id === postId
                                ? { ...item, reactions: nextReactions }
                                : item
                        )
                    );
                }
            } catch (err) {
                notify(err.message || "Không thể thả cảm xúc.", "error");
            } finally {
                setReactingPostId(null);
            }
        },
        [isAuthenticated, redirectToLogin, notify]
    );

    const handleConfirmDelete = useCallback(async () => {
        if (!deletingPost || deletingLoading) return;
        try {
            setDeletingLoading(true);
            await deletePost(deletingPost.id);
            setDeletingPost(null);
            notify("Đã xóa bài viết.", "success");
            await refreshPosts({ silent: true });
        } catch (err) {
            notify(err.message || "Không thể xóa bài viết.", "error");
        } finally {
            setDeletingLoading(false);
        }
    }, [deletingPost, deletingLoading, notify, refreshPosts]);

    return {
        isAuthenticated,
        redirectToLogin,
        posts,
        pagination,
        loading,
        error,
        notice,
        notify,
        dismissNotice,
        reactingPostId,
        deletingPost,
        setDeletingPost,
        deletingLoading,
        refreshPosts,
        handleReact,
        handleConfirmDelete,
    };
}
