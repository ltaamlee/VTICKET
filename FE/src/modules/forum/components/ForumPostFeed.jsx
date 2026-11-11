import { useCallback, useImperativeHandle, useState } from "react";
import { MessagesSquare } from "lucide-react";
import Button from "../../../components/common/button/Button";
import ConfirmModal from "../../../components/common/ConfirmModal";
import Pagination from "../../../components/common/Pagination";
import { useForumPosts } from "../hooks/useForumPosts";
import ForumNotice from "./ForumNotice";
import PostCard from "./PostCard";
import PostFormModal from "./PostFormModal";

function ForumPostFeed({
    ref,
    filters,
    onPageChange,
    onResetToFirstPage,
    onTotalChange,
    lockedEvent = null,
    preloadedEvents,
    hideEventTag = false,
    hasActiveFilters = false,
    onResetFilters,
    emptyTitle = "Chưa tìm thấy bài viết nào",
    emptyDescription = "Hãy mở đầu cuộc trò chuyện bằng bài viết đầu tiên của bạn!",
    createButtonLabel = "Đăng bài viết",
    createSuccessMessage = "Đã đăng bài viết mới!",
    skeletonCount = 3,
}) {
    const {
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
    } = useForumPosts({ ...filters, onTotalChange });

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    const handleOpenCreateModal = useCallback(() => {
        if (!isAuthenticated) {
            redirectToLogin();
            return;
        }
        setEditingPost(null);
        setIsFormModalOpen(true);
    }, [isAuthenticated, redirectToLogin]);

    const handleOpenEditModal = useCallback((post) => {
        setEditingPost(post);
        setIsFormModalOpen(true);
    }, []);

    useImperativeHandle(
        ref,
        () => ({
            openCreate: handleOpenCreateModal,
        }),
        [handleOpenCreateModal]
    );

    const handlePostSaved = async (_, mode) => {
        setIsFormModalOpen(false);
        setEditingPost(null);
        notify(
            mode === "update" ? "Đã cập nhật bài viết thành công." : createSuccessMessage,
            "success"
        );
        if (mode === "create" && (filters?.page || 1) !== 1 && onResetToFirstPage) {
            onResetToFirstPage();
        } else {
            await refreshPosts({ silent: true });
        }
    };

    const currentEventId = filters?.eventId;

    return (
        <div className="space-y-4">
            <ForumNotice notice={notice} onDismiss={dismissNotice} />

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: skeletonCount }).map((_, idx) => (
                        <div
                            key={idx}
                            className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-200" />
                                <div className="space-y-2">
                                    <div className="h-4 w-32 rounded bg-slate-200" />
                                    <div className="h-3 w-24 rounded bg-slate-100" />
                                </div>
                            </div>
                            <div className="mt-4 h-5 w-2/3 rounded bg-slate-200" />
                            <div className="mt-2 h-4 w-full rounded bg-slate-100" />
                            <div className="mt-1 h-4 w-5/6 rounded bg-slate-100" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
                    <p className="text-sm font-medium text-red-600">{error}</p>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => refreshPosts()}
                        className="mt-4"
                    >
                        Thử lại
                    </Button>
                </div>
            ) : posts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center sm:p-12">
                    <MessagesSquare
                        className="mx-auto h-10 w-10 text-slate-300"
                        aria-hidden="true"
                    />
                    <h3 className="mt-3 text-base font-semibold text-slate-800">
                        {emptyTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
                    <div className="mt-5 flex justify-center gap-3">
                        {hasActiveFilters && onResetFilters && (
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={onResetFilters}
                            >
                                Xóa bộ lọc
                            </Button>
                        )}
                        <Button type="button" size="sm" onClick={handleOpenCreateModal}>
                            {createButtonLabel}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            hideEventTag={hideEventTag}
                            onReact={handleReact}
                            reactingPostId={reactingPostId}
                            onEdit={handleOpenEditModal}
                            onDelete={(target) => setDeletingPost(target)}
                        />
                    ))}

                    <div className="pt-2">
                        <Pagination
                            page={pagination.currentPage || filters?.page || 1}
                            totalPages={pagination.totalPages || 1}
                            onPageChange={onPageChange}
                        />
                    </div>
                </div>
            )}

            <PostFormModal
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setEditingPost(null);
                }}
                onSuccess={handlePostSaved}
                editingPost={editingPost}
                defaultEventId={
                    currentEventId && currentEventId !== "general" ? currentEventId : ""
                }
                lockedEvent={lockedEvent}
                preloadedEvents={preloadedEvents}
            />

            <ConfirmModal
                isOpen={Boolean(deletingPost)}
                onClose={() => !deletingLoading && setDeletingPost(null)}
                onConfirm={handleConfirmDelete}
                variant="danger"
                title="Xóa bài viết"
                message={`Bạn có chắc muốn xóa bài viết "${deletingPost?.title || ""}"?`}
                description="Bài viết sẽ bị xóa khỏi diễn đàn và không thể khôi phục."
                confirmText="Xóa bài viết"
                cancelText="Hủy"
                loading={deletingLoading}
            />
        </div>
    );
}

export default ForumPostFeed;
