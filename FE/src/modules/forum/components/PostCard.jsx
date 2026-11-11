import {
    Calendar,
    EyeOff,
    MessageCircle,
    MessageSquare,
    Pencil,
    Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import AuthorBadge from "./AuthorBadge";
import ReactionBar from "./ReactionBar";
import { getEventDetailPath } from "../utils/forumHelpers";

function PostCard({
    post,
    onReact,
    reactingPostId = null,
    onEdit,
    onDelete,
    hideEventTag = false,
}) {
    const postDetailPath = `/forum/${post.id}`;
    const isHidden = post.status === "HIDDEN";

    return (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <AuthorBadge
                    author={post.author}
                    createdAt={post.createdAt}
                    updatedAt={post.updatedAt}
                />

                <div className="flex flex-wrap items-center gap-2">
                    {isHidden && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                            Đang bị ẩn
                        </span>
                    )}

                    {!hideEventTag && (
                        post.event ? (
                            <Link
                                to={getEventDetailPath(post.event)}
                                className="inline-flex max-w-xs items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                            >
                                <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate">{post.event.name}</span>
                            </Link>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                Thảo luận chung
                            </span>
                        )
                    )}
                </div>
            </div>

            <div className="mt-4">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    <Link
                        to={postDetailPath}
                        className="transition-colors hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        {post.title}
                    </Link>
                </h2>

                {post.excerpt && (
                    <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                        {post.excerpt}
                    </p>
                )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <ReactionBar
                    reactions={post.reactions}
                    disabled={reactingPostId === post.id}
                    onReact={(type) => onReact?.(post.id, type)}
                />

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        to={`${postDetailPath}#comments`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        <span>{post.commentCount || 0} bình luận</span>
                    </Link>

                    {post.isOwner && (
                        <>
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={() => onEdit(post)}
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                                >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                    Sửa
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(post)}
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                    Xóa
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}

export default PostCard;

