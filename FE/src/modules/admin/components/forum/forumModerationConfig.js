export const MODERATION_STATUS_BADGES = {
    VISIBLE: {
        label: "Đang hiển thị",
        className: "bg-emerald-100 text-emerald-700",
    },
    HIDDEN: {
        label: "Đang bị ẩn",
        className: "bg-amber-100 text-amber-800",
    },
    DELETED: {
        label: "Đã xóa",
        className: "bg-rose-100 text-rose-700",
    },
};

export const MODERATION_STATUS_OPTIONS = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "VISIBLE", label: "Đang hiển thị" },
    { value: "HIDDEN", label: "Đang bị ẩn" },
    { value: "DELETED", label: "Đã xóa" },
];

export function getModerationConfirmConfig(targetType, nextStatus) {
    const isPost = targetType === "post";
    const entity = isPost ? "bài viết" : "bình luận";

    if (nextStatus === "HIDDEN") {
        return {
            title: `Ẩn ${entity}`,
            message: `Bạn có chắc chắn muốn ẩn ${entity} này?`,
            description: isPost
                ? "Bài viết sẽ bị ẩn khỏi danh sách công khai trên diễn đàn, nhưng Admin vẫn có thể khôi phục lại."
                : "Bình luận sẽ bị ẩn khỏi người dùng (nếu có phản hồi con sẽ hiển thị thông báo đã ẩn).",
            variant: "warning",
            confirmText: `Ẩn ${entity}`,
        };
    }

    if (nextStatus === "VISIBLE") {
        return {
            title: `Khôi phục ${entity}`,
            message: `Bạn muốn hiển thị lại ${entity} này?`,
            description: `${isPost ? "Bài viết" : "Bình luận"} sẽ hiển thị trở lại bình thường trên diễn đàn.`,
            variant: "success",
            confirmText: "Hiển thị lại",
        };
    }

    return {
        title: `Xóa ${entity}`,
        message: `Bạn có chắc chắn muốn đánh dấu xóa ${entity} này?`,
        description: `${isPost ? "Bài viết" : "Bình luận"} sẽ chuyển sang trạng thái Đã xóa khỏi cộng đồng.`,
        variant: "danger",
        confirmText: `Xóa ${entity}`,
    };
}

