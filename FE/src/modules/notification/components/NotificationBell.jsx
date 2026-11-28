import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    CheckCheck,
    Inbox,
    Trash2,
    Wifi,
    WifiOff,
} from "lucide-react";
import { useNotifications } from "../../../contexts/NotificationContext";
import {
    NOTIFICATION_TYPE_COLORS,
    NOTIFICATION_TYPE_ICONS,
    DEFAULT_NOTIFICATION_TYPE_COLOR,
    DEFAULT_NOTIFICATION_TYPE_ICON,
} from "../constants/notificationConstants";

/**
 * Chuông thông báo realtime trên Header.
 *
 * - Hiển thị số thông báo chưa đọc.
 * - Nhận thông báo mới tức thì qua Socket.IO (NotificationContext).
 * - Bấm vào thông báo -> đánh dấu đã đọc + điều hướng tới link liên quan.
 */
function NotificationBell() {
    const {
        notifications,
        unreadCount,
        loading,
        connected,
        handleMarkAsRead,
        handleMarkAllAsRead,
        handleDelete,
        handleClearRead,
    } = useNotifications();

    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const handleOpenItem = async (item) => {
        if (item.status === "UNREAD") {
            await handleMarkAsRead(item.id);
        }

        if (item.link) {
            navigate(item.link);
        }

        setOpen(false);
    };

    const formatTime = (value) => {
        if (!value) return "";

        const date = new Date(value);
        const diff = Date.now() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;

        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getItemIcon = (item) => {
        // type la chuoi tu do, loai moi se dung icon/mau mac dinh.
        const Icon =
            NOTIFICATION_TYPE_ICONS[item.type] ||
            DEFAULT_NOTIFICATION_TYPE_ICON;
        const colorClass =
            NOTIFICATION_TYPE_COLORS[item.type] ||
            DEFAULT_NOTIFICATION_TYPE_COLOR;
        return { Icon, colorClass };
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Thông báo"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-gray-700 transition hover:bg-blue-200/60 hover:border-blue-300 cursor-pointer"
            >
                <Bell size={20} />

                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-gray-100 bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900">
                                Thông báo
                            </h3>

                            {unreadCount > 0 && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                    {unreadCount} chưa đọc
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAllAsRead}
                                    title="Đánh dấu tất cả đã đọc"
                                    className="rounded-lg p-1.5 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                                >
                                    <CheckCheck size={16} />
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleClearRead}
                                title="Xóa thông báo đã đọc"
                                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Danh sách */}
                    <div className="max-h-[26rem] overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="px-4 py-10 text-center text-sm text-gray-500">
                                Đang tải thông báo...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                    <Inbox size={22} />
                                </div>
                                <p className="text-sm font-medium text-gray-700">
                                    Chưa có thông báo nào
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {notifications.map((item) => {
                                    const { Icon, colorClass } =
                                        getItemIcon(item);

                                    return (
                                        <li key={item.id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleOpenItem(item)
                                                }
                                                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-blue-50/50 ${
                                                    item.status === "UNREAD"
                                                        ? "bg-blue-50/30"
                                                        : ""
                                                }`}
                                            >
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
                                                >
                                                    <Icon size={17} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={`truncate text-sm ${
                                                            item.status ===
                                                            "UNREAD"
                                                                ? "font-bold text-gray-900"
                                                                : "font-semibold text-gray-700"
                                                        }`}
                                                    >
                                                        {item.title}
                                                    </p>

                                                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                                                        {item.body}
                                                    </p>

                                                    <p className="mt-1 text-[10px] font-medium text-gray-400">
                                                        {formatTime(
                                                            item.createdAt
                                                        )}
                                                    </p>
                                                </div>

                                                {item.status === "UNREAD" && (
                                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                                )}
                                            </button>

                                            <div className="-mt-1 flex justify-end px-4 pb-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(item.id)
                                                    }
                                                    className="cursor-pointer text-[10px] font-medium text-gray-400 transition hover:text-red-600"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
