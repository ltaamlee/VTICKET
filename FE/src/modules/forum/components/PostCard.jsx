import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    EyeOff,
    MoreHorizontal,
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
            className="cursor-pointer px-5 py-5 transition-colors hover:bg-slate-50/60 sm:px-6"
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

                    {post.isOwner && (onEdit || onDelete) && (
                        <div ref={menuRef} className="relative text-slate-400">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((prev) => !prev)}
                                title="Tùy chọn bài viết"
                                aria-label="Tùy chọn bài viết"
                                aria-expanded={menuOpen}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                    {onEdit && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                onEdit(post);
                                            }}
                                            className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Chỉnh sửa
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                onDelete(post);
                                            }}
                                            className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Xóa
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4">
                {post.excerpt && (
                    <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                        {post.excerpt}
                    </p>
                )}

                {(post.mediaUrls?.length > 0 || post.gifUrl) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {post.mediaUrls?.map((url, idx) => (
                            <img
                                key={`${url}-${idx}`}
                                src={url}
                                alt=""
                                className="max-h-72 rounded-xl border border-slate-100 object-cover"
                            />
                        ))}
                        {post.gifUrl && (
                            <img
                                src={post.gifUrl}
                                alt="GIF"
                                className="max-h-60 rounded-xl border border-slate-100 object-cover"
                            />
                        )}
                    </div>
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
