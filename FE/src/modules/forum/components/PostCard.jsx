import { useNavigate } from "react-router-dom";
import {
    EyeOff,
    Pencil,
    Trash2,
} from "lucide-react";
import AuthorBadge from "./AuthorBadge";
import PostActionBar from "./PostActionBar";

function PostCard({
    post,
    onReact,
    reactingPostId = null,
    onEdit,
    onDelete,
    hideEventTag = false,
}) {
    const navigate = useNavigate();
    const postDetailPath = `/forum/${post.id}`;
    const isHidden = post.status === "HIDDEN";
    const isEventOrganizer = Boolean(
        post.event?.organizerId && post.author?.id === post.event.organizerId
    );

    const handleCardClick = (e) => {
        if (e.target.closest("button, a, input, textarea")) {
            return;
        }
        navigate(postDetailPath);
    };

    return (
        <article
            onClick={handleCardClick}
            className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md sm:p-6"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                {/* Header tác giả phong cách Threads: [Avatar] Tên tác giả > Tên sự kiện  Thời gian */}
                <AuthorBadge
                    author={post.author}
                    event={hideEventTag ? null : post.event}
                    createdAt={post.createdAt}
                    updatedAt={post.updatedAt}
                    isEventOrganizer={isEventOrganizer}
                />

                <div className="flex flex-wrap items-center gap-2">
                    {isHidden && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                            Đang bị ẩn
                        </span>
                    )}

                    {post.isOwner && (
                        <div className="flex items-center gap-1 text-slate-400">
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={() => onEdit(post)}
                                    title="Chỉnh sửa bài viết"
                                    aria-label="Sửa bài"
                                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(post)}
                                    title="Xóa bài viết"
                                    aria-label="Xóa bài"
                                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    <span>{post.title}</span>
                </h2>

                {post.excerpt && (
                    <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                        {post.excerpt}
                    </p>
                )}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-3">
                <PostActionBar
                    postId={post.id}
                    reactions={post.reactions}
                    commentCount={post.commentCount}
                    disabled={reactingPostId === post.id}
                    onReact={(type) => onReact?.(post.id, type)}
                />
            </div>
        </article>
    );
}

export default PostCard;
