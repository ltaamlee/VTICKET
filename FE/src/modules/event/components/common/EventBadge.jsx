import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

/**
 * EventBadge - Hiển thị trạng thái bán vé của sự kiện
 */
export default function EventBadge({ status, size = "md" }) {
    const sizeClasses = {
        sm: "px-2 py-0.5 text-xs gap-1",
        md: "px-2.5 py-1 text-xs gap-1.5 font-medium",
        lg: "px-3 py-1.5 text-sm gap-2 font-semibold",
    };

    switch (status) {
        case "SELLING":
            return (
                <span
                    className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 shadow-xs ${sizeClasses[size]}`}
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đang mở bán
                </span>
            );
        case "UPCOMING":
            return (
                <span
                    className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 shadow-xs ${sizeClasses[size]}`}
                >
                    <Clock className="h-3 w-3" />
                    Sắp mở bán
                </span>
            );
        case "SOLD_OUT":
            return (
                <span
                    className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 shadow-xs ${sizeClasses[size]}`}
                >
                    <XCircle className="h-3 w-3" />
                    Hết vé
                </span>
            );
        case "ENDED":
            return (
                <span
                    className={`inline-flex items-center rounded-full bg-gray-100 text-gray-600 ring-1 ring-gray-400/20 shadow-xs ${sizeClasses[size]}`}
                >
                    <AlertCircle className="h-3 w-3" />
                    Đã kết thúc
                </span>
            );
        default:
            return (
                <span
                    className={`inline-flex items-center rounded-full bg-gray-50 text-gray-700 ring-1 ring-gray-600/20 ${sizeClasses[size]}`}
                >
                    <CheckCircle2 className="h-3 w-3" />
                    Sự kiện
                </span>
            );
    }
}

