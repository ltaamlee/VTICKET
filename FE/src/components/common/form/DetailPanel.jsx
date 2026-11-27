import { X } from "lucide-react";

/**
 * DetailPanel - Panel modal dùng chung cho các màn hình xem chi tiết.
 *
 * Cùng cấu trúc với FormPanel nhưng không có form submit, dùng cho
 * modal xem chi tiết (danh mục, tài khoản, sự kiện, đơn đăng ký...).
 */

const SIZE_CLASSES = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
};

function DetailPanel({
    title,
    subtitle,
    icon: Icon,
    onClose,
    children,
    headerExtra,
    footer,
    size = "md",
    overlayClassName = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
    panelClassName = "",
    bodyClassName = "px-6 py-5",
    headerClassName = "border-b border-gray-200 px-6 py-4",
    footerClassName = "border-t border-gray-200 px-6 py-4",
    closeButtonClassName =
        "shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600",
}) {
    return (
        <div className={overlayClassName}>
            <div
                role="dialog"
                aria-modal="true"
                className={`flex max-h-[92vh] w-full ${
                    SIZE_CLASSES[size] || SIZE_CLASSES.md
                } flex-col overflow-hidden rounded-2xl bg-white shadow-xl ${panelClassName}`}
            >
                {/* Header */}
                <div
                    className={`flex shrink-0 items-start justify-between gap-4 ${headerClassName}`}
                >
                    <div className="flex min-w-0 items-center gap-3">
                        {Icon && (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Icon size={20} />
                            </span>
                        )}
                        <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold text-gray-900">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="mt-0.5 text-xs text-gray-500">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className={closeButtonClassName}
                        aria-label="Đóng"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Header extra (ví dụ: tab điều hướng) */}
                {headerExtra}

                {/* Body */}
                <div
                    className={`min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}
                >
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div
                        className={`flex shrink-0 justify-end gap-3 ${footerClassName}`}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DetailPanel;
