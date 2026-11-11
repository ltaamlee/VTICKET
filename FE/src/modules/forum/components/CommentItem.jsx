import { useId, useState } from "react";
import { CornerDownRight, Pencil, Reply, Trash2 } from "lucide-react";
import AuthorBadge from "./AuthorBadge";
import CommentComposer from "./CommentComposer";

function CommentItem({
    comment,
    depth = 0,
    parentAuthorName = null,
    isAuthenticated = false,
    onReplySubmit,
    onEditSubmit,
    onDeleteRequest,
    onRequireAuth,
}) {
    const replyFormId = useId();
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleToggleReply = () => {
        if (!isAuthenticated) {
            onRequireAuth?.();
            return;
        }
        setShowReplyForm((prev) => !prev);
    };

    const handleEditSubmit = async (trimmed) => {
        await onEditSubmit?.(comment.id, trimmed);
        setIsEditing(false);
    };

    const handleReplySubmit = async (trimmed) => {
        await onReplySubmit?.(comment.id, trimmed);
        setShowReplyForm(false);
    };

    const hasReplies = Array.isArray(comment.replies) && comment.replies.length > 0;
    const repliesContainerClass =
        depth < 2
            ? "mt-3 ml-3 space-y-3 border-l-2 border-slate-200 pl-3 sm:ml-6 sm:pl-4"
            : "mt-3 space-y-3";

    return (
        <div className="space-y-2">
            {comment.isPlaceholder ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm italic text-slate-500">
                    {comment.content || "Bình luận này đã bị ẩn hoặc xóa."}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <AuthorBadge
                            author={comment.author}
                            createdAt={comment.createdAt}
                            updatedAt={comment.updatedAt}
                            size="sm"
                        />

                        {depth >= 2 && parentAuthorName && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                <CornerDownRight className="h-3 w-3" aria-hidden="true" />
                                Trả lời {parentAuthorName}
                            </span>
                        )}
                    </div>

                    {isEditing ? (
                        <CommentComposer
                            key={`edit-${comment.id}-${comment.updatedAt || ""}`}
                            label="Chỉnh sửa bình luận"
                            labelHidden={true}
                            initialValue={comment.content || ""}
                            rows={3}
                            emptyErrorMessage="Nội dung bình luận không được để trống."
                            fallbackErrorMessage="Không thể cập nhật bình luận."
                            submitLabel="Lưu"
                            buttonSize="sm"
                            className="mt-3"
                            onSubmit={handleEditSubmit}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <>
                            <p className="mt-2.5 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-slate-700">
                                {comment.content}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                                <button
                                    type="button"
                                    aria-expanded={showReplyForm}
                                    aria-controls={replyFormId}
                                    onClick={handleToggleReply}
                                    className="inline-flex cursor-pointer items-center gap-1 font-medium text-slate-600 transition-colors hover:text-blue-600"
                                >
                                    <Reply className="h-3.5 w-3.5" aria-hidden="true" />
                                    Trả lời
                                </button>

                                {comment.isOwner && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            className="inline-flex cursor-pointer items-center gap-1 font-medium text-slate-600 transition-colors hover:text-blue-600"
                                        >
                                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                            Sửa
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onDeleteRequest?.(comment)}
                                            className="inline-flex cursor-pointer items-center gap-1 font-medium text-red-600 transition-colors hover:text-red-700"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                            Xóa
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {showReplyForm && (
                        <CommentComposer
                            id={replyFormId}
                            label={`Phản hồi ${comment.author?.name || "bình luận"}`}
                            rows={2}
                            placeholder="Nhập phản hồi của bạn... (Ctrl+Enter để gửi)"
                            emptyErrorMessage="Vui lòng nhập nội dung phản hồi."
                            fallbackErrorMessage="Không thể gửi phản hồi."
                            submitLabel="Gửi phản hồi"
                            buttonSize="sm"
                            clearOnSuccess={true}
                            className="mt-3 border-t border-slate-100 pt-3"
                            onSubmit={handleReplySubmit}
                            onCancel={() => setShowReplyForm(false)}
                        />
                    )}
                </div>
            )}

            {hasReplies && (
                <div className={repliesContainerClass}>
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            parentAuthorName={
                                comment.isPlaceholder ? null : comment.author?.name || null
                            }
                            isAuthenticated={isAuthenticated}
                            onReplySubmit={onReplySubmit}
                            onEditSubmit={onEditSubmit}
                            onDeleteRequest={onDeleteRequest}
                            onRequireAuth={onRequireAuth}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CommentItem;
