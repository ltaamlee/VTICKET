import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
    ROLE_BADGES,
    BTC_BADGE,
    formatFullDateTime,
    formatRelativeTime,
    getInitials,
    isEdited,
    getEventDetailPath,
} from "../utils/forumHelpers";


function AuthorBadge({
    author,
    event = null,
    createdAt,
    updatedAt,
    size = "md",
    isEventOrganizer = false,
}) {
    const displayName = author?.name || "Người dùng VTicket";

    // Chỉ gắn tag BTC khi người này là BTC của chính sự kiện đó
    const isBtc = Boolean(isEventOrganizer || author?.isEventOrganizer);

    // Huy hiệu Quản trị viên chỉ dành cho ADMIN
    const adminBadge = author?.role === "ADMIN" ? ROLE_BADGES.ADMIN : null;

    const avatarSizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
    const edited = isEdited(createdAt, updatedAt);

    return (
        <div className="flex min-w-0 items-center gap-3">
            {/* Avatar tác giả */}
            {author?.avatar ? (
                <img
                    src={author.avatar}
                    alt={displayName}
                    className={`${avatarSizeClass} shrink-0 rounded-full border border-slate-200 object-cover`}
                />
            ) : (
                <div
                    aria-hidden="true"
                    className={`${avatarSizeClass} flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-indigo-600 font-semibold text-white`}
                >
                    {getInitials(displayName)}
                </div>
            )}

            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    {/* Tên tác giả */}
                    <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                        {displayName}
                    </span>

                    {/* Tag Ban tổ chức nếu đúng là BTC của sự kiện này */}
                    {isBtc && (
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${BTC_BADGE.className}`}
                        >
                            {BTC_BADGE.label}
                        </span>
                    )}

                    {/* Tag sự kiện dạng: > Tên sự kiện (chuẩn Threads như ảnh 2) */}
                    {event && (
                        <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                            <ChevronRight
                                className="h-4 w-4 text-slate-400 shrink-0"
                                aria-hidden="true"
                            />
                            <Link
                                to={getEventDetailPath(event)}
                                onClick={(e) => e.stopPropagation()}
                                className="truncate max-w-[180px] sm:max-w-xs hover:text-blue-600 transition-colors"
                                title={event.name}
                            >
                                {event.name}
                            </Link>
                        </span>
                    )}

                    {/* Tag Quản trị viên (nếu là Admin và không gắn tag BTC) */}
                    {!isBtc && adminBadge && (
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${adminBadge.className}`}
                        >
                            {adminBadge.label}
                        </span>
                    )}

                    {/* Thời gian đăng bài */}
                    {createdAt && (
                        <span className="text-xs text-slate-400 font-normal ml-1 whitespace-nowrap">
                            <time
                                dateTime={createdAt}
                                title={formatFullDateTime(createdAt)}
                            >
                                {formatRelativeTime(createdAt)}
                            </time>
                            {edited && (
                                <span
                                    title={`Chỉnh sửa lúc ${formatFullDateTime(updatedAt)}`}
                                    className="text-slate-400 ml-1"
                                >
                                    • đã sửa
                                </span>
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuthorBadge;
