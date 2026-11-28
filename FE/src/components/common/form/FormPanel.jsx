import { X } from "lucide-react";

const SIZE_CLASSES = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
};

export const FORM_PANEL_INPUT_CLASS =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50";

export const FORM_PANEL_LABEL_CLASS =
    "mb-2 block text-sm font-medium text-gray-700";

export const FORM_PANEL_ERROR_CLASS =
    "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700";

function FormPanel({
    title,
    subtitle,
    icon: Icon,
    onClose,
    onSubmit,
    children,
    headerExtra,
    footer,
    loading = false,
    error = "",
    size = "md",
    submitText = "Lưu",
    cancelText = "Hủy",
    submitVariant = "primary",
    showCancel = true,
    showFooter = true,
    overlayClassName = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
    panelClassName = "",
    bodyClassName = "px-6 py-5",
    headerClassName = "border-b border-gray-200 px-6 py-4",
    footerClassName = "border-t border-gray-200 px-6 py-4",
    closeButtonClassName =
        "shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50",
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit?.();
    };

    return (
        <div className={overlayClassName}>
            <div
                role="dialog"
                aria-modal="true"
                className={`flex max-h-[90vh] w-full ${
                    SIZE_CLASSES[size] || SIZE_CLASSES.md
                } flex-col overflow-hidden rounded-2xl bg-white shadow-xl ${panelClassName}`}
            >
                {/* Header */}
                <div
                    className={`flex items-start justify-between gap-4 ${headerClassName}`}
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
                        disabled={loading}
                        className={closeButtonClassName}
                        aria-label="Đóng"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Header extra (ví dụ: stepper điều hướng nhiều bước) */}
                {headerExtra}

                {/* Body */}
                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div
                        className={`min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}
                    >
                        {error && (
                            <p role="alert" className={FORM_PANEL_ERROR_CLASS}>
                                {error}
                            </p>
                        )}

                        <div className="space-y-4">{children}</div>
                    </div>

                    {/* Footer */}
                    {showFooter && (
                        <div
                            className={`flex justify-end gap-3 ${footerClassName}`}
                        >
                            {footer || (
                                <>
                                    {showCancel && (
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={loading}
                                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {cancelText}
                                        </button>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                            submitVariant === "danger"
                                                ? "bg-red-600 hover:bg-red-700"
                                                : submitVariant === "success"
                                                ? "bg-emerald-600 hover:bg-emerald-700"
                                                : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                    >
                                        {loading ? "Đang xử lý..." : submitText}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default FormPanel;
