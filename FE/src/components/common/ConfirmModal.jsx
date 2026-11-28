import { TriangleAlert, CircleAlert, Info, CircleCheck, X } from "lucide-react";
import Button from "./button/Button";

const icons = {
    danger: TriangleAlert,
    warning: CircleAlert,
    info: Info,
    success: CircleCheck,
};

const styles = {
    danger: {
        icon: "bg-red-100 text-red-500",
        button: "bg-red-600 hover:bg-red-700",
    },
    warning: {
        icon: "bg-yellow-100 text-yellow-600",
        button: "bg-yellow-500 hover:bg-yellow-600",
    },
    info: {
        icon: "bg-blue-100 text-blue-600",
        button: "bg-blue-600 hover:bg-blue-700",
    },
    success: {
        icon: "bg-green-100 text-green-600",
        button: "bg-green-600 hover:bg-green-700",
    },
};

function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Xác nhận",
    message,
    description,
    variant = "info",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    loading = false,
}) {
    if (!isOpen) return null;

    const Icon = icons[variant] || Info;
    const style = styles[variant] || styles.info;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                    <h3 className="text-xl font-semibold text-gray-900">
                        {title}
                    </h3>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex items-start gap-5 px-6 py-6">
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${style.icon}`}
                    >
                        <Icon size={24} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-xl font-semibold text-gray-900">
                            {message}
                        </p>

                        {description && (
                            <div className="mt-2 text-sm leading-relaxed text-gray-500">
                                {description}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-5">
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>

                    <Button
                        variant="primary"
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;