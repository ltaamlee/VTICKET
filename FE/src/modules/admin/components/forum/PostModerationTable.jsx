import { Calendar, Heart, MessageCircle, MessageSquare } from "lucide-react";
import { formatFullDateTime } from "../../../forum/utils/forumHelpers";
import { ModerationActions, ModerationStatusBadge } from "./ModerationControls";

export default function PostModerationTable({
    posts = [],
    loading = false,
    onViewPost,
    onFilterCommentsByPost,
    onModeratePost,
}) {
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                        <th className="px-5 py-4">Bài viết & Chủ đề</th>
                        <th className="px-5 py-4">Tác giả</th>
                        <th className="px-5 py-4">Tương tác</th>
                        <th className="px-5 py-4">Ngày đăng</th>
                        <th className="px-5 py-4">Trạng thái</th>
                        <th className="w-40 px-5 py-4 text-center">Thao tác</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr>
                            <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                                Đang tải danh sách bài viết...
                            </td>
                        </tr>
                    ) : posts.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-5 py-12 text-center">
                                <p className="mb-1 font-medium text-gray-600">
                                    Không có bài viết nào
                                </p>
                                <p className="text-xs text-gray-400">
                                    Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.
                                </p>
                            </td>
                        </tr>
                    ) : (
                        posts.map((post) => (
                            <tr key={post.id} className="hover:bg-gray-50/70">
                                <td className="max-w-md px-5 py-4">
                                    <button
                                        type="button"
                                        onClick={() => onViewPost?.(post.id)}
                                        className="cursor-pointer text-left font-semibold text-gray-900 hover:text-blue-600"
                                    >
                                        {post.title}
                                    </button>
                                    {post.excerpt && (
                                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                                            {post.excerpt}
                                        </p>
                                    )}
                                    <div className="mt-2">
                                        {post.event ? (
                                            <span className="inline-flex max-w-xs items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                                                <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
                                                <span className="truncate">{post.event.name}</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                                                <MessageCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                                                Thảo luận chung
                                            </span>
                                        )}
                                    </div>
                                </td>

                                <td className="px-5 py-4">
                                    <p className="font-medium text-gray-900">
                                        {post.author?.name || "Người dùng"}
                                    </p>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {post.author?.email || "—"}
                                    </p>
                                </td>

                                <td className="px-5 py-4">
                                    <div className="flex flex-col gap-1 text-xs">
                                        <span className="inline-flex items-center gap-1 text-gray-700">
                                            <Heart className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
                                            {post.reactions?.total ?? 0} cảm xúc
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onFilterCommentsByPost?.(post)}
                                            className="inline-flex w-fit cursor-pointer items-center gap-1 text-blue-600 hover:underline"
                                        >
                                            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                                            <span>{post.totalComments ?? post.commentCount ?? 0} bình luận</span>
                                            {post.hiddenCommentCount > 0 && (
                                                <span className="text-amber-700">
                                                    ({post.hiddenCommentCount} ẩn)
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </td>

                                <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">
                                    {formatFullDateTime(post.createdAt)}
                                </td>

                                <td className="px-5 py-4">
                                    <ModerationStatusBadge status={post.status} />
                                </td>

                                <td className="px-5 py-4">
                                    <ModerationActions
                                        status={post.status}
                                        entityLabel="bài viết"
                                        onView={() => onViewPost?.(post.id)}
                                        onModerate={(nextStatus) =>
                                            onModeratePost?.(post, nextStatus)
                                        }
                                    />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

