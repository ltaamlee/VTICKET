import { useEffect, useId, useRef, useState } from "react";
import { CornerDownRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import AuthorBadge from "./AuthorBadge";
import CommentComposer from "./CommentComposer";
import PostActionBar from "./PostActionBar";


function countAllReplies(comment) {
    if (!Array.isArray(comment?.replies) || comment.replies.length === 0) {
        return 0;
    }
    return comment.replies.reduce(
        (sum, reply) => sum + 1 + countAllReplies(reply),
        0
    );
}

function CommentItem({
    comment,
    postId,
    eventOrganizerId = null,
    depth = 0,
    parentAuthorName = null,
    activeReplyCommentId = null,
    onActiveReplyChange,
    isAuthenticated = false,
    onReplySubmit,
    onEditSubmit,
    onDeleteRequest,
    onRequireAuth,
}) {
    const replyFormId = useId();
    const showReplyForm = activeReplyCommentId === comment.id;
    const [showReplies, setShowReplies] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
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

    // Quản lý reaction cho bình luận 
    const storageKey = `vticket_comment_liked_${comment.id}`;
    const [isLiked, setIsLiked] = useState(() => {
        try {
            return localStorage.getItem(storageKey) === "true";
        } catch {
            return false;
        }
    });
    const [likeCount, setLikeCount] = useState(() => (isLiked ? 1 : 0));

    const handleToggleLike = () => {
        if (!isAuthenticated) {
            onRequireAuth?.();
            return;
        }
        setIsLiked((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(storageKey, String(next));
            } catch {
                // ignore
            }
            setLikeCount((cnt) => (next ? cnt + 1 : Math.max(0, cnt - 1)));
            return next;
        });
    };

    const handleToggleReply = () => {
        if (!isAuthenticated) {
            onRequireAuth?.();
            return;
        }
        if (showReplyForm) {
            onActiveReplyChange?.(null);
            setShowReplies(false);
        } else {
            onActiveReplyChange?.(comment.id);
            setShowReplies(true);
        }
    };

    const handleEditSubmit = async (trimmed) => {
        await onEditSubmit?.(comment.id, trimmed);
        setIsEditing(false);
    };

    const handleReplySubmit = async (trimmed) => {
        await onReplySubmit?.(comment.id, trimmed);
        onActiveReplyChange?.(null);
        setShowReplies(true);
    };

    const hasReplies = Array.isArray(comment.replies) && comment.replies.length > 0;
    const repliesCount = countAllReplies(comment);
    const repliesContainerClass =
        depth < 2
            ? "mt-3 ml-3 space-y-3 border-l-2 border-slate-200 pl-3 sm:ml-6 sm:pl-4"
            : "mt-3 space-y-3";

    const commentShareUrl = `${window.location.origin}/forum/${postId || ""}?commentId=${comment.id}#comment-${comment.id}`;
    const isEventOrganizer = Boolean(
        eventOrganizerId && comment.author?.id === eventOrganizerId
    );

    return (
        <div id={`comment-${comment.id}`} className="space-y-2">
            {comment.isPlaceholder ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm italic text-slate-500">
                    {comment.content || "Bình luận này đã bị ẩn hoặc xóa."}
                </div>
            ) : (
                <div className="py-2">
                    {/* Header thông tin tác giả & Thao tác Sửa/Xóa nếu là chủ sở hữu */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <AuthorBadge
                                author={comment.author}
                                createdAt={comment.createdAt}
                                updatedAt={comment.updatedAt}
                                isEventOrganizer={isEventOrganizer}
                                size="sm"
                            />

                            {depth >= 2 && parentAuthorName && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                    <CornerDownRight className="h-3 w-3" aria-hidden="true" />
                                    Trả lời {parentAuthorName}
                                </span>
                            )}
                        </div>

                        {/* Nút 3 chấm mở menu Sửa / Xóa cho chủ bình luận */}
                        {comment.isOwner && !isEditing && (
                            <div ref={menuRef} className="relative text-slate-400">
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                    title="Tùy chọn bình luận"
                                    aria-label="Tùy chọn bình luận"
                                    aria-expanded={menuOpen}
                                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                setIsEditing(true);
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
                                                onDeleteRequest?.(comment);
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

                    {/* Nội dung câu trả lời */}
                    {isEditing ? (
                        <div className="mt-3">
                            <CommentComposer
                                key={`edit-${comment.id}-${comment.updatedAt || ""}`}
                                label="Chỉnh sửa bình luận"
                                labelHidden={true}
                                initialValue={comment.content || ""}
                                emptyErrorMessage="Nội dung bình luận không được để trống."
                                fallbackErrorMessage="Không thể cập nhật bình luận."
                                clearOnSuccess={false}
                                onSubmit={handleEditSubmit}
                                onCancel={() => setIsEditing(false)}
                            />
                        </div>
                    ) : (
                        <>
                            <p className="mt-2.5 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-slate-800">
                                {comment.content}
                            </p>

                            {/* Cụm 4 icon trên bài đăng: Tim, Bình luận, Đăng lại, Chia sẻ */}
                            <div className="mt-2.5 pt-1">
                                <PostActionBar
                                    postId={postId || comment.id}
                                    shareUrl={commentShareUrl}
                                    reactions={{
                                        total: likeCount,
                                        myReaction: isLiked ? "LIKE" : null,
                                    }}
                                    commentCount={repliesCount}
                                    size="sm"
                                    onReact={handleToggleLike}
                                    onCommentClick={handleToggleReply}
                                />
                            </div>
                        </>
                    )}

                    {/* Khung nhập phản hồi (Reply Composer) khi bấm nút Bình luận */}
                    {showReplyForm && (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                            <CommentComposer
                                id={replyFormId}
                                label={`Phản hồi @${comment.author?.name || "bình luận"}`}
                                labelHidden={false}
                                placeholder={`Trả lời @${comment.author?.name || "bình luận"}...`}
                                emptyErrorMessage="Vui lòng nhập nội dung phản hồi."
                                fallbackErrorMessage="Không thể gửi phản hồi."
                                clearOnSuccess={true}
                                autoFocus={true}
                                onSubmit={handleReplySubmit}
                                onCancel={() => onActiveReplyChange?.(null)}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Danh sách các câu trả lời con (replies lồng nhau, tối đa 3 cấp) */}
            {hasReplies && showReplies && (
                <div className={repliesContainerClass}>
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            postId={postId}
                            eventOrganizerId={eventOrganizerId}
                            depth={depth + 1}
                            parentAuthorName={
                                comment.isPlaceholder ? null : comment.author?.name || null
                            }
                            activeReplyCommentId={activeReplyCommentId}
                            onActiveReplyChange={onActiveReplyChange}
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
