import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
} from "../modules/notification/services/notificationService";

const NotificationContext = createContext({
    notifications: [],
    unreadCount: 0,
    loading: false,
    connected: false,
    fetchNotifications: async () => {},
    refreshUnreadCount: async () => {},
    handleMarkAsRead: async () => {},
    handleMarkAllAsRead: async () => {},
    handleDelete: async () => {},
    handleClearRead: async () => {},
});

const API_URL = import.meta.env.VITE_API_URL;

export function NotificationProvider({ children }) {
    const { token, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);

    const socketRef = useRef(null);

    /**
     * Lấy danh sách thông báo + số chưa đọc.
     */
    const fetchNotifications = useCallback(
        async ({ page = 1, pageSize = 20 } = {}) => {
            if (!token) return;

            try {
                setLoading(true);
                const response = await getNotifications({ page, pageSize });
                const data = response?.data ?? response;

                setNotifications(Array.isArray(data?.items) ? data.items : []);
                setUnreadCount(Number(data?.unreadCount) || 0);
            } catch {
                // Im lặng: không chặn giao diện khi lỗi tải thông báo.
            } finally {
                setLoading(false);
            }
        },
        [token]
    );

    /**
     * Chỉ lấy số thông báo chưa đọc (nhẹ hơn, dùng khi kết nối realtime).
     */
    const refreshUnreadCount = useCallback(async () => {
        if (!token) return;

        try {
            const response = await getUnreadCount();
            const data = response?.data ?? response;
            setUnreadCount(Number(data?.unreadCount) || 0);
        } catch {
            // Bỏ qua lỗi mạng.
        }
    }, [token]);

    /**
     * Đánh dấu đã đọc (cập nhật cục bộ trước để UI phản hồi tức thì).
     */
    const handleMarkAsRead = useCallback(
        async (id) => {
            if (!id) return;

            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? { ...item, status: "READ", readAt: new Date().toISOString() }
                        : item
                )
            );
            setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));

            try {
                const response = await markAsRead(id);
                const data = response?.data ?? response;
                if (typeof data?.unreadCount === "number") {
                    setUnreadCount(data.unreadCount);
                }
            } catch {
                // Đồng bộ lại từ server nếu cập nhật cục bộ sai.
                refreshUnreadCount();
            }
        },
        [refreshUnreadCount]
    );

    /**
     * Đánh dấu toàn bộ đã đọc.
     */
    const handleMarkAllAsRead = useCallback(async () => {
        setNotifications((prev) =>
            prev.map((item) => ({
                ...item,
                status: "READ",
                readAt: item.readAt || new Date().toISOString(),
            }))
        );
        setUnreadCount(0);

        try {
            const response = await markAllAsRead();
            const data = response?.data ?? response;
            if (typeof data?.unreadCount === "number") {
                setUnreadCount(data.unreadCount);
            }
        } catch {
            refreshUnreadCount();
        }
    }, [refreshUnreadCount]);

    /**
     * Xóa một thông báo.
     */
    const handleDelete = useCallback(
        async (id) => {
            if (!id) return;

            const target = notifications.find((item) => item.id === id);
            setNotifications((prev) => prev.filter((item) => item.id !== id));
            if (target?.status === "UNREAD") {
                setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
            }

            try {
                await deleteNotification(id);
            } catch {
                refreshUnreadCount();
            }
        },
        [notifications, refreshUnreadCount]
    );

    /**
     * Xóa toàn bộ thông báo đã đọc.
     */
    const handleClearRead = useCallback(async () => {
        setNotifications((prev) => prev.filter((item) => item.status !== "READ"));

        try {
            const response = await clearReadNotifications();
            const data = response?.data ?? response;
            if (typeof data?.unreadCount === "number") {
                setUnreadCount(data.unreadCount);
            }
        } catch {
            refreshUnreadCount();
        }
    }, [refreshUnreadCount]);

    /**
     * Kết nối Socket.IO để nhận thông báo realtime.
     */
    useEffect(() => {
        if (!isAuthenticated || !token || !API_URL) {
            setConnected(false);
            return undefined;
        }

        const socket = io(API_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 8000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            refreshUnreadCount();
        });

        socket.on("disconnect", () => {
            setConnected(false);
        });

        socket.on("connect_error", (error) => {
            setConnected(false);
            if (error?.message === "UNAUTHORIZED" || error?.message === "ACCOUNT_INACTIVE") {
                socket.disconnect();
            }
        });

        // Nhận thông báo mới
        socket.on("notification:new", (payload) => {
            if (!payload) return;

            setNotifications((prev) => {
                if (prev.some((item) => item.id === payload.id)) return prev;
                return [payload, ...prev].slice(0, 50);
            });

            setUnreadCount((prev) => prev + 1);
        });

        // Đồng bộ số thông báo chưa đọc
        socket.on("notification:sync", (payload) => {
            if (typeof payload?.unreadCount === "number") {
                setUnreadCount(payload.unreadCount);
            }
        });

        socket.on("notification:read:result", (payload) => {
            if (typeof payload?.unreadCount === "number") {
                setUnreadCount(payload.unreadCount);
            }
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [isAuthenticated, token, refreshUnreadCount]);

    // Tải danh sách thông báo khi đăng nhập
    useEffect(() => {
        if (isAuthenticated && token) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, token, fetchNotifications]);

    const value = useMemo(
        () => ({
            notifications,
            unreadCount,
            loading,
            connected,
            fetchNotifications,
            refreshUnreadCount,
            handleMarkAsRead,
            handleMarkAllAsRead,
            handleDelete,
            handleClearRead,
        }),
        [
            notifications,
            unreadCount,
            loading,
            connected,
            fetchNotifications,
            refreshUnreadCount,
            handleMarkAsRead,
            handleMarkAllAsRead,
            handleDelete,
            handleClearRead,
        ]
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}
