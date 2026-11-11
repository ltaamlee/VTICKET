import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const STYLES = {
    success: {
        container: "border-emerald-200 bg-emerald-50 text-emerald-900",
        icon: CheckCircle2,
        iconClass: "text-emerald-600",
    },
    error: {
        container: "border-red-200 bg-red-50 text-red-900",
        icon: AlertCircle,
        iconClass: "text-red-600",
    },
    info: {
        container: "border-blue-200 bg-blue-50 text-blue-900",
        icon: Info,
        iconClass: "text-blue-600",
    },
};

function ForumNotice({ notice, onDismiss }) {
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => {
            onDismiss?.();
        }, 4500);
        return () => clearTimeout(timer);
    }, [notice, onDismiss]);

    if (!notice?.message) return null;

    const style = STYLES[notice.type] || STYLES.info;
    const Icon = style.icon;

    return (
        <div
            role={notice.type === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xs ${style.container}`}
        >
            <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 shrink-0 ${style.iconClass}`} aria-hidden="true" />
                <span>{notice.message}</span>
            </div>
            <button
                type="button"
                onClick={() => onDismiss?.()}
                aria-label="Đóng thông báo"
                className="cursor-pointer rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
            >
                <X className="h-4 w-4" aria-hidden="true" />
            </button>
        </div>
    );
}

export default ForumNotice;

