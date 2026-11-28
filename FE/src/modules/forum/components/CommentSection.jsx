import { useState } from "react";
import { MessageSquare } from "lucide-react";
import Button from "../../../components/common/button/Button";
import ConfirmModal from "../../../components/common/ConfirmModal";
import {
    createComment,
    deleteComment,
    updateComment,
} from "../services/forumService";
import CommentComposer from "./CommentComposer";
import CommentItem from "./CommentItem";

function CommentSection({
    postId,
    eventOrganizerId = null,
    comments = [],
    totalComments = 0,
    isAuthenticated = false,
    onRefreshPost,
    onRequireAuth,
    onNotify,
}) {
    const [deletingComment, setDeletingComment] = useState(null);
    const [deletingLoading, setDeletingLoading] = useState(false);
    const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);

    const handleRootSubmit = async (trimmed, media = {}) => {
        await createComment(postId, { content: trimmed, ...media });
        await onRefreshPost?.({ silent: true });
        onNotify?.("Đã đăng bình luận.", "success");
    };

    const handleReplySubmit = async (parentId, content, media = {}) => {
        await createComment(postId, { content, parentId, ...media });
        await onRefreshPost?.({ silent: true });
        onNotify?.("Đã gửi phản hồi.", "success");
    };

    const handleEditSubmit = async (commentId, content, media = {}) => {
        await updateComment(commentId, { content, ...media });
        await onRefreshPost?.({ silent: true });
        onNotify?.("Đã cập nhật bình luận.", "success");
    };

    const handleConfirmDelete = async () => {
        if (!deletingComment || deletingLoading) return;
        try {
            setDeletingLoading(true);
            await deleteComment(deletingComment.id);
            setDeletingComment(null);
            await onRefreshPost?.({ silent: true });
            onNotify?.("Đã xóa bình luận.", "success");
        } catch (err) {
            onNotify?.(err.message || "Không thể xóa bình luận.", "error");
        } finally {
            setDeletingLoading(false);
        }
    };

    return (
        <section
            id="comments"
            aria-label="Bình luận"
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-8"
        >
            <div>
                {isAuthenticated ? (
                    <CommentComposer
                        placeholder="Viết bình luận của bạn... (Enter để gửi)"
                        emptyErrorMessage="Vui lòng nhập nội dung bình luận."
                        fallbackErrorMessage="Không thể đăng bình luận."
                        clearOnSuccess={true}
                        onSubmit={handleRootSubmit}
                    />
                ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-600">
                            Đăng nhập để viết bình luận hoặc trả lời thành viên khác.
                        </p>
                        <Button type="button" size="sm" onClick={onRequireAuth}>
                            Đăng nhập ngay
                        </Button>
                    </div>
                )}
            </div>

            <div className="mt-6 space-y-4">
                {comments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                        Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ ý kiến!
                    </div>
                ) : (
                    comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                            eventOrganizerId={eventOrganizerId}
                            depth={0}
                            activeReplyCommentId={activeReplyCommentId}
                            onActiveReplyChange={setActiveReplyCommentId}
                            isAuthenticated={isAuthenticated}
                            onReplySubmit={handleReplySubmit}
                            onEditSubmit={handleEditSubmit}
                            onDeleteRequest={(target) => setDeletingComment(target)}
                            onRequireAuth={onRequireAuth}
                        />
                    ))
                )}
            </div>

            <ConfirmModal
                isOpen={Boolean(deletingComment)}
                onClose={() => !deletingLoading && setDeletingComment(null)}
                onConfirm={handleConfirmDelete}
                variant="danger"
                title="Xóa bình luận"
                message="Bạn có chắc chắn muốn xóa bình luận này?"
                description="Nếu bình luận đã có phản hồi bên dưới, nội dung sẽ được ẩn đi để giữ mạch thảo luận."
                confirmText="Xóa bình luận"
                cancelText="Hủy"
                loading={deletingLoading}
            />
        </section>
    );
}

export default CommentSection;
