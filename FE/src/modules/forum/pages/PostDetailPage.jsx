import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ChevronRight,
    EyeOff,
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
import PostFormModal from "../components/PostFormModal";
import PostActionBar from "../components/PostActionBar";
import { usePostDetail } from "../hooks/usePostDetail";

function PostDetailPage() {
    const { id } = useParams();
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

            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
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
                                        <>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                icon={Pencil}
                                                onClick={() => setIsEditModalOpen(true)}
                                            >
                                                Sửa bài
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="danger"
                                                icon={Trash2}
                                                onClick={() => setIsDeleteModalOpen(true)}
                                            >
                                                Xóa
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                {post.title}
                            </h1>

                            <div className="mt-6 whitespace-pre-wrap wrap-break-word text-base leading-relaxed text-slate-800">
                                {post.content}
                            </div>

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
