import { useEffect, useId, useRef } from "react";
import { AlertTriangle, Calendar, MessageCircle, MessageSquare, X } from "lucide-react";
import Button from "../../../../components/common/button/Button";
import { handleDialogBackdropClick } from "../../../../utils/dialog";
import AuthorBadge from "../../../forum/components/AuthorBadge";
import { formatFullDateTime } from "../../../forum/utils/forumHelpers";
import { getModerationConfirmConfig } from "./forumModerationConfig";
import { ModerationActions, ModerationStatusBadge } from "./ModerationControls";

function AdminCommentTreeNode({ comment, depth = 0, onModerateComment }) {
    const hasReplies = Array.isArray(comment.replies) && comment.replies.length > 0;
    const indentClass =
        depth < 2
            ? "mt-3 ml-3 space-y-2.5 border-l-2 border-slate-200 pl-3 sm:ml-6 sm:pl-4"
            : "mt-2.5 space-y-2.5";

    return (
        <div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">
                                {comment.author?.name || "Người dùng"}
                            </span>
                            {comment.author?.email && (
                                <span className="text-xs text-slate-500">
                                    ({comment.author.email})
                                </span>
                            )}
                            <ModerationStatusBadge status={comment.status} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                            {formatFullDateTime(comment.createdAt)}
                        </p>
                    </div>

                    <ModerationActions
                        status={comment.status}
                        entityLabel="bình luận"
                        size={15}
                        onModerate={(nextStatus) =>
                            onModerateComment?.(comment, nextStatus)
                        }
                    />
                </div>

                <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-slate-700">
                    {comment.content}
                </p>
            </div>

            {hasReplies && (
                <div className={indentClass}>
                    {comment.replies.map((reply) => (
                        <AdminCommentTreeNode
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            onModerateComment={onModerateComment}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PostModerationDetailModal({
    isOpen,
    post,
    loading = false,
    error = "",
    pendingAction = null,
    processing = false,
    onConfirmPending,
    onCancelPending,
    onClose,
    onModeratePost,
    onModerateComment,
}) {
    const dialogRef = useRef(null);
    const headingId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            if (!dialog.open) {
                dialog.showModal();
            }
        } else if (dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    const handleNativeClose = () => {
        if (isOpen && !processing) {
            onClose?.();
        }
    };

    const confirmMeta = pendingAction
        ? getModerationConfirmConfig(pendingAction.targetType, pendingAction.nextStatus)
        : null;

    return (
        <dialog
            ref={dialogRef}
            closedby="any"
            aria-labelledby={headingId}
            onClose={handleNativeClose}
            onCancel={(e) => {
                if (processing) e.preventDefault();
            }}
            onClick={(e) => {
                if (!processing) {
                    handleDialogBackdropClick(e, dialogRef.current, onClose);
                }
            }}
            className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl"
        >
            {isOpen && (
                <div className="flex max-h-[90vh] flex-col">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                        <h2 id={headingId} className="text-lg font-bold text-slate-900">
                            Chi tiết kiểm duyệt bài viết
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            aria-label="Đóng chi tiết"
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>

                    {confirmMeta && (
                        <div
                            role="alert"
                            aria-live="polite"
                            className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-6 py-3"
                        >
                            <div className="flex items-start gap-2.5 text-sm text-amber-900">
                                <AlertTriangle
                                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="font-semibold">{confirmMeta.message}</p>
                                    <p className="text-xs text-amber-800">
                                        {confirmMeta.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={onCancelPending}
                                    disabled={processing}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        confirmMeta.variant === "danger"
                                            ? "danger"
                                            : confirmMeta.variant === "success"
                                                ? "success"
                                                : "primary"
                                    }
                                    onClick={onConfirmPending}
                                    loading={processing}
                                >
                                    {confirmMeta.confirmText}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="py-12 text-center text-sm text-slate-500">
                                Đang tải chi tiết bài viết...
                            </div>
                        ) : error ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                {error}
                            </div>
                        ) : post ? (
                            <div className="space-y-6">
                                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                    <div className="space-y-1">
                                        <AuthorBadge
                                            author={post.author}
                                            createdAt={post.createdAt}
                                            updatedAt={post.updatedAt}
                                        />
                                        {post.author?.email && (
                                            <p className="pl-13 text-xs text-slate-500">
                                                Email: {post.author.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <ModerationStatusBadge status={post.status} />
                                        <ModerationActions
                                            status={post.status}
                                            entityLabel="bài viết"
                                            onModerate={(nextStatus) =>
                                                onModeratePost?.(post, nextStatus)
                                            }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2">
                                        {post.event ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                                {post.event.name}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                                Thảo luận chung
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900">
                                        {post.title}
                                    </h3>

                                    <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-slate-700">
                                        {post.content}
                                    </p>
                                </div>

                                <div className="border-t border-slate-100 pt-5">
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                                        <MessageSquare className="h-4 w-4 text-blue-600" aria-hidden="true" />
                                        <span>
                                            Toàn bộ bình luận ({post.totalComments ?? 0})
                                        </span>
                                    </h4>

                                    {!post.comments || post.comments.length === 0 ? (
                                        <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                                            Bài viết chưa có bình luận nào.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {post.comments.map((comment) => (
                                                <AdminCommentTreeNode
                                                    key={comment.id}
                                                    comment={comment}
                                                    depth={0}
                                                    onModerateComment={onModerateComment}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </dialog>
    );
}
