import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ChevronRight,
    EyeOff,
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react";
import Header from "../../../layout/Header";
import Footer from "../../../layout/Footer";
import Button from "../../../components/common/button/Button";
import ConfirmModal from "../../../components/common/ConfirmModal";
import AuthorBadge from "../components/AuthorBadge";
import CommentSection from "../components/CommentSection";
import ForumNotice from "../components/ForumNotice";
import ForumSidebar from "../components/ForumSidebar";
import ForumRightSearch from "../components/ForumRightSearch";
import PostFormModal from "../components/PostFormModal";
import PostActionBar from "../components/PostActionBar";
import { usePostDetail } from "../hooks/usePostDetail";

function PostDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
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
    } = usePostDetail(id);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem("vticket_forum_sidebar_open");
        return saved !== null ? saved === "true" : true;
    });

    const handleToggleSidebar = useCallback(() => {
        setIsSidebarOpen((prev) => {
            const next = !prev;
            localStorage.setItem("vticket_forum_sidebar_open", String(next));
            return next;
        });
    }, []);

    const handlePostUpdated = async () => {
        setIsEditModalOpen(false);
        notify("Đã cập nhật bài viết.", "success");
        await refreshPost({ silent: true });
    };

    const onConfirmDelete = async () => {
        try {
            await handleDeletePost();
        } catch {
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Header />

            <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-1">
                {!isSidebarOpen && (
                    <button
                        type="button"
                        onClick={handleToggleSidebar}
                        title="Mở thanh điều hướng"
                        aria-label="Mở thanh điều hướng"
                        className="fixed left-3 top-20 z-30 hidden md:flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-700 shadow-md backdrop-blur-md transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 cursor-pointer"
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        >
                            <line x1="4" y1="8" x2="20" y2="8" />
                            <line x1="4" y1="16" x2="20" y2="16" />
                        </svg>
                    </button>
                )}

                <ForumSidebar
                    isOpen={isSidebarOpen}
                    onToggle={handleToggleSidebar}
                    onOpenCreate={() => navigate("/forum")}
                    onNotify={notify}
                />

                <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                <nav
                    aria-label="Đường dẫn"
                    className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500"
                >
                    <Link
                        to="/forum"
                        className="inline-flex items-center gap-1 font-medium text-slate-600 transition-colors hover:text-blue-600"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Diễn đàn
                    </Link>
                    {post?.event && (
                        <>
                            <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            <Link
                                to={`/forum?eventId=${post.event.id}`}
                                className="max-w-xs truncate hover:text-blue-600"
                            >
                                {post.event.name}
                            </Link>
                        </>
                    )}
                </nav>

                <div className="mb-4">
                    <ForumNotice notice={notice} onDismiss={dismissNotice} />
                </div>

                {loading ? (
                    <div className="animate-pulse space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-200" />
                            <div className="space-y-2">
                                <div className="h-4 w-36 rounded bg-slate-200" />
                                <div className="h-3 w-24 rounded bg-slate-100" />
                            </div>
                        </div>
                        <div className="h-7 w-3/4 rounded bg-slate-200" />
                        <div className="space-y-2">
                            <div className="h-4 w-full rounded bg-slate-100" />
                            <div className="h-4 w-full rounded bg-slate-100" />
                            <div className="h-4 w-2/3 rounded bg-slate-100" />
                        </div>
                    </div>
                ) : error || !post ? (
                    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
                        <p className="text-base font-medium text-red-600">
                            {error || "Không tìm thấy bài viết."}
                        </p>
                        <Link
                            to="/forum"
                            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Quay lại diễn đàn
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-8">
                            {post.status === "HIDDEN" && (
                                <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
                                    <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                                    Bài viết này đang bị quản trị viên tạm ẩn khỏi cộng đồng.
                                </div>
                            )}

                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <AuthorBadge
                                    author={post.author}
                                    event={post.event}
                                    createdAt={post.createdAt}
                                    updatedAt={post.updatedAt}
                                    isEventOrganizer={Boolean(
                                        post.event?.organizerId &&
                                            post.author?.id === post.event.organizerId
                                    )}
                                />

                                <div className="flex flex-wrap items-center gap-2">
                                    {post.isOwner && (
                                        <div ref={menuRef} className="relative text-slate-400">
                                            <button
                                                type="button"
                                                onClick={() => setMenuOpen((prev) => !prev)}
                                                title="Tùy chọn bài viết"
                                                aria-label="Tùy chọn bài viết"
                                                aria-expanded={menuOpen}
                                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>

                                            {menuOpen && (
                                                <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setMenuOpen(false);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Chỉnh sửa
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setMenuOpen(false);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Xóa
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 whitespace-pre-wrap wrap-break-word text-base leading-relaxed text-slate-800">
                                {post.content}
                            </div>

                            {(post.mediaUrls?.length > 0 || post.gifUrl) && (
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {post.mediaUrls?.map((url, idx) => (
                                        <img
                                            key={`${url}-${idx}`}
                                            src={url}
                                            alt=""
                                            className="max-h-96 rounded-2xl border border-slate-100 object-cover"
                                        />
                                    ))}
                                    {post.gifUrl && (
                                        <img
                                            src={post.gifUrl}
                                            alt="GIF"
                                            className="max-h-72 rounded-2xl border border-slate-100 object-cover"
                                        />
                                    )}
                                </div>
                            )}

                            <div className="mt-8 border-t border-slate-100 pt-4 flex items-center justify-between">
                                <PostActionBar
                                    postId={post.id}
                                    reactions={post.reactions}
                                    commentCount={post.totalComments ?? post.commentCount ?? 0}
                                    disabled={reacting}
                                    onReact={handleReact}
                                    onCommentClick={() => {
                                        const el = document.getElementById("comments");
                                        if (el) el.scrollIntoView({ behavior: "smooth" });
                                    }}
                                />
                            </div>
                        </article>

                        <CommentSection
                            postId={post.id}
                            eventOrganizerId={post.event?.organizerId}
                            comments={post.comments || []}
                            totalComments={post.totalComments ?? post.commentCount ?? 0}
                            isAuthenticated={isAuthenticated}
                            onRefreshPost={refreshPost}
                            onRequireAuth={redirectToLogin}
                            onNotify={notify}
                        />
                    </div>
                )}
            </main>

            <ForumRightSearch />
            </div>

            {post && (
                <>
                    <PostFormModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSuccess={handlePostUpdated}
                        editingPost={post}
                    />

                    <ConfirmModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => !deleting && setIsDeleteModalOpen(false)}
                        onConfirm={onConfirmDelete}
                        variant="danger"
                        title="Xóa bài viết"
                        message={`Bạn có chắc chắn muốn xóa bài viết "${post.title}"?`}
                        description="Tất cả bình luận và cảm xúc liên quan cũng sẽ không còn hiển thị."
                        confirmText="Xóa bài viết"
                        cancelText="Hủy"
                        loading={deleting}
                    />
                </>
            )}

            <Footer />
        </div>
    );
}

export default PostDetailPage;
