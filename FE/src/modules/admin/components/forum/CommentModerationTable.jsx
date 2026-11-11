import { CornerDownRight, MessageSquare } from "lucide-react";
import { formatFullDateTime } from "../../../forum/utils/forumHelpers";
import { ModerationActions, ModerationStatusBadge } from "./ModerationControls";

export default function CommentModerationTable({
    comments = [],
    loading = false,
    onViewPost,
    onModerateComment,
}) {
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                        <th className="px-5 py-4">Nội dung bình luận</th>
                        <th className="px-5 py-4">Thuộc bài viết</th>
                        <th className="px-5 py-4">Tác giả</th>
                        <th className="px-5 py-4">Ngày tạo</th>
                        <th className="px-5 py-4">Trạng thái</th>
                        <th className="w-40 px-5 py-4 text-center">Thao tác</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr>
                            <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                                Đang tải danh sách bình luận...
                            </td>
                        </tr>
                    ) : comments.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-5 py-12 text-center">
                                <p className="mb-1 font-medium text-gray-600">
                                    Không có bình luận nào
                                </p>
                                <p className="text-xs text-gray-400">
                                    Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.
                                </p>
                            </td>
                        </tr>
                    ) : (
                        comments.map((comment) => (
                            <tr key={comment.id} className="hover:bg-gray-50/70">
                                <td className="max-w-md px-5 py-4">
                                    {comment.parentPreview && (
                                        <div className="mb-1.5 flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                                            <CornerDownRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                                            <span className="truncate">
                                                Trả lời <strong>{comment.parentPreview.authorName}</strong>:{" "}
                                                {comment.parentPreview.content}
                                            </span>
                                        </div>
                                    )}

                                    <p className="line-clamp-3 whitespace-pre-wrap wrap-break-word text-sm text-gray-900">
                                        {comment.content}
                                    </p>

                                    {comment.replyCount > 0 && (
                                        <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-gray-500">
                                            <MessageSquare className="h-3 w-3" aria-hidden="true" />
                                            {comment.replyCount} phản hồi bên dưới
                                        </p>
                                    )}
                                </td>

                                <td className="max-w-xs px-5 py-4">
                                    {comment.post ? (
                                        <button
                                            type="button"
                                            onClick={() => onViewPost?.(comment.post.id)}
                                            className="cursor-pointer text-left text-xs font-medium text-blue-600 hover:underline"
                                        >
                                            {comment.post.title}
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
                                </td>

                                <td className="px-5 py-4">
                                    <p className="font-medium text-gray-900">
                                        {comment.author?.name || "Người dùng"}
                                    </p>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {comment.author?.email || "—"}
                                    </p>
                                </td>

                                <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">
                                    {formatFullDateTime(comment.createdAt)}
                                </td>

                                <td className="px-5 py-4">
                                    <ModerationStatusBadge status={comment.status} />
                                </td>

                                <td className="px-5 py-4">
                                    <ModerationActions
                                        status={comment.status}
                                        entityLabel="bình luận"
                                        onView={
                                            comment.post?.id
                                                ? () => onViewPost?.(comment.post.id)
                                                : undefined
                                        }
                                        onModerate={(nextStatus) =>
                                            onModerateComment?.(comment, nextStatus)
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

