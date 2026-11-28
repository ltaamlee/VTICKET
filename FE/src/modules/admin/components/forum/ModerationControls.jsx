import IconButton from "../../../../components/common/button/IconButton";
import { MODERATION_STATUS_BADGES } from "./forumModerationConfig";

export function ModerationStatusBadge({ status }) {
    const config = MODERATION_STATUS_BADGES[status] || {
        label: status || "Không xác định",
        className: "bg-gray-100 text-gray-600",
    };

    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
        >
            {config.label}
        </span>
    );
}

export function ModerationActions({
    status,
    entityLabel = "mục",
    onView,
    onModerate,
    size = 16,
}) {
    return (
        <div className="flex items-center justify-center gap-1.5">
            {onView && (
                <IconButton
                    icon="view"
                    variant="view"
                    size={size}
                    title={`Xem chi tiết ${entityLabel}`}
                    onClick={onView}
                />
            )}

            {status === "VISIBLE" && (
                <IconButton
                    icon="lock"
                    variant="lock"
                    size={size}
                    title={`Ẩn ${entityLabel}`}
                    onClick={() => onModerate?.("HIDDEN")}
                />
            )}

            {(status === "HIDDEN" || status === "DELETED") && (
                <IconButton
                    icon="unlock"
                    variant="unlock"
                    size={size}
                    title={`Hiển thị lại ${entityLabel}`}
                    onClick={() => onModerate?.("VISIBLE")}
                />
            )}

            {status !== "DELETED" && (
                <IconButton
                    icon="delete"
                    variant="delete"
                    size={size}
                    title={`Xóa ${entityLabel}`}
                    onClick={() => onModerate?.("DELETED")}
                />
            )}
        </div>
    );
}

