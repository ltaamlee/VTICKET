import {
    ROLE_BADGES,
    formatFullDateTime,
    formatRelativeTime,
    getInitials,
    isEdited,
} from "../utils/forumHelpers";

function AuthorBadge({
    author,
    createdAt,
    updatedAt,
    size = "md",
}) {
    const displayName = author?.name || "Người dùng VTicket";
    const roleBadge = author?.role ? ROLE_BADGES[author.role] : null;
    const avatarSizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
    const edited = isEdited(createdAt, updatedAt);

    return (
        <div className="flex min-w-0 items-center gap-3">
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
                <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-slate-900">
                        {displayName}
                    </span>
                    {roleBadge && (
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${roleBadge.className}`}
                        >
                            {roleBadge.label}
                        </span>
                    )}
                </div>

                {createdAt && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <time
                            dateTime={createdAt}
                            title={formatFullDateTime(createdAt)}
                        >
                            {formatRelativeTime(createdAt)}
                        </time>
                        {edited && (
                            <span
                                title={`Chỉnh sửa lúc ${formatFullDateTime(updatedAt)}`}
                                className="text-slate-400"
                            >
                                • đã chỉnh sửa
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AuthorBadge;

