import { FileText, MessageSquare } from "lucide-react";
import ConfirmModal from "../../../components/common/ConfirmModal";
import Pagination from "../../../components/common/Pagination";
import Tabs from "../../../components/common/Tabs";
import ForumNotice from "../../forum/components/ForumNotice";
import CommentModerationTable from "../components/forum/CommentModerationTable";
import { getModerationConfirmConfig } from "../components/forum/forumModerationConfig";
import ForumModerationToolbar from "../components/forum/ForumModerationToolbar";
import ForumStatsCards from "../components/forum/ForumStatsCards";
import PostModerationDetailModal from "../components/forum/PostModerationDetailModal";
import PostModerationTable from "../components/forum/PostModerationTable";
import { useAdminForumModeration } from "../hooks/useAdminForumModeration";

const moderationTabs = [
    { id: "posts", label: "Quản lý bài viết", icon: FileText },
    { id: "comments", label: "Quản lý bình luận", icon: MessageSquare },
];

function ForumManagement() {
    const {
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
    } = useAdminForumModeration();

    const confirmMeta = confirmAction
        ? getModerationConfirmConfig(confirmAction.targetType, confirmAction.nextStatus)
        : null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Quản lý diễn đàn
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Theo dõi thống kê, kiểm duyệt bài viết và bình luận trên toàn diễn đàn.
                </p>
            </div>

            <ForumStatsCards stats={stats} loading={statsLoading} />

            <Tabs
                key={activeTab}
                tabs={moderationTabs}
                defaultTab={activeTab}
                onChange={handleTabChange}
            />

            <ForumNotice notice={notice} onDismiss={dismissNotice} />

            <ForumModerationToolbar
                key={`${activeTab}-${postIdFilter?.id || "all"}`}
                activeTab={activeTab}
                keyword={keyword}
                status={status}
                eventId={eventId}
                postIdFilter={postIdFilter}
                onKeywordSubmit={handleKeywordSubmit}
                onStatusChange={handleStatusChange}
                onEventIdChange={handleEventIdChange}
                onClearPostFilter={handleClearPostFilter}
                onReset={handleResetFilters}
            />

            {error && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => refreshList()}
                        className="cursor-pointer font-semibold underline"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {activeTab === "posts" ? (
                <PostModerationTable
                    posts={posts}
                    loading={loading}
                    onViewPost={openPostDetail}
                    onFilterCommentsByPost={filterCommentsByPost}
                    onModeratePost={(post, nextStatus) =>
                        requestModeration("post", post, nextStatus)
                    }
                />
            ) : (
                <CommentModerationTable
                    comments={comments}
                    loading={loading}
                    onViewPost={openPostDetail}
                    onModerateComment={(comment, nextStatus) =>
                        requestModeration("comment", comment, nextStatus)
                    }
                />
            )}

            <Pagination
                page={pagination.currentPage || page}
                totalPages={pagination.totalPages || 1}
                onPageChange={setPage}
            />

            <PostModerationDetailModal
                isOpen={Boolean(detailPostId)}
                post={detailPost}
                loading={detailLoading}
                error={detailError}
                pendingAction={detailPostId ? confirmAction : null}
                processing={processing}
                onConfirmPending={executeModeration}
                onCancelPending={closeConfirmAction}
                onClose={closePostDetail}
                onModeratePost={(post, nextStatus) =>
                    requestModeration("post", post, nextStatus)
                }
                onModerateComment={(comment, nextStatus) =>
                    requestModeration("comment", comment, nextStatus)
                }
            />

            <ConfirmModal
                isOpen={Boolean(confirmAction) && !detailPostId}
                onClose={closeConfirmAction}
                onConfirm={executeModeration}
                variant={confirmMeta?.variant || "info"}
                title={confirmMeta?.title || "Xác nhận"}
                message={confirmMeta?.message || ""}
                description={confirmMeta?.description || ""}
                confirmText={confirmMeta?.confirmText || "Xác nhận"}
                cancelText="Hủy"
                loading={processing}
            />
        </div>
    );
}

export default ForumManagement;
