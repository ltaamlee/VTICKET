import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import {
    deletePost,
    getPostDetail,
    toggleReaction,
} from "../services/forumService";
import { useAuthRedirect } from "./useAuthRedirect";
import { useForumNotice } from "./useForumNotice";

export function usePostDetail(postId) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const redirectToLogin = useAuthRedirect();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { notice, notify, dismissNotice } = useForumNotice();
    const [reacting, setReacting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const executeFetch = useCallback(() => {
        return getPostDetail(postId);
    }, [postId]);

    const refreshPost = useCallback(
        async ({ silent = false } = {}) => {
            if (!postId) return;
            try {
                if (!silent) setLoading(true);
                setError("");
                const res = await executeFetch();
                setPost(res.data);
            } catch (err) {
                setError(err.message || "Không thể tải bài viết.");
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [postId, executeFetch]
    );

    useEffect(() => {
        if (!postId) return;
        let active = true;

        const run = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await executeFetch();
                if (active) {
                    setPost(res.data);
                }
            } catch (err) {
                if (active) {
                    setError(err.message || "Không thể tải bài viết.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        run();
        return () => {
            active = false;
        };
    }, [postId, executeFetch]);

    const loadedPostId = post?.id;

    const handleReact = useCallback(
        async (type) => {
            if (!isAuthenticated) {
                redirectToLogin();
                return;
            }
            if (!loadedPostId) return;
            try {
                setReacting(true);
                const res = await toggleReaction(loadedPostId, type);
                if (res.data?.reactions) {
                    setPost((prev) =>
                        prev ? { ...prev, reactions: res.data.reactions } : prev
                    );
                }
            } catch (err) {
                notify(err.message || "Không thể thả cảm xúc.", "error");
            } finally {
                setReacting(false);
            }
        },
        [isAuthenticated, redirectToLogin, loadedPostId, notify]
    );

    const handleDeletePost = useCallback(async () => {
        if (!loadedPostId || deleting) return;
        try {
            setDeleting(true);
            await deletePost(loadedPostId);
            navigate("/forum", { replace: true });
        } catch (err) {
            notify(err.message || "Không thể xóa bài viết.", "error");
            throw err;
        } finally {
            setDeleting(false);
        }
    }, [loadedPostId, deleting, navigate, notify]);

    return {
        isAuthenticated,
        redirectToLogin,
        post,
        loading,
        error,
        notice,
        notify,
        dismissNotice,
        reacting,
        deleting,
        refreshPost,
        handleReact,
        handleDeletePost,
    };
}
