/**
 * Notification Realtime (Socket.IO)
 *
 * Quản lý kết nối realtime cho hệ thống thông báo.
 *
 * - Xác thực bằng JWT (Bearer token hoặc query param "token").
 * - Mỗi user có 1 room riêng: `user:<userId>` -> nhận thông báo cá nhân.
 * - Room theo vai trò: `role:<ROLE>` -> nhận thông báo đại diện (admin...).
 * - Room toàn cục: `all` -> nhận thông báo broadcast.
 *
 * Gateway được khởi tạo 1 lần trong server.js và expose qua
 * `attach(httpServer)` để Socket.IO dùng chung HTTP server với Express.
 */

const { Server } = require("socket.io");
const JwtUtils = require("../../utils/jwtUtils");

let io = null;

/**
 * Phát tin tới đúng một user (dùng room `user:<userId>`).
 */
function emitToUser(userId, event, payload) {
    if (!io || !userId) return false;
    io.to(`user:${userId}`).emit(event, payload);
    return true;
}

/**
 * Phát tin tới tất cả user thuộc một vai trò.
 */
function emitToRole(role, event, payload) {
    if (!io || !role) return false;
    io.to(`role:${role}`).emit(event, payload);
    return true;
}

/**
 * Phát tin tới toàn bộ người đang kết nối.
 */
function emitToAll(event, payload) {
    if (!io) return false;
    io.emit(event, payload);
    return true;
}

/**
 * Lấy số kết nối đang online (theo vai trò).
 */
function getOnlineCount(role = null) {
    if (!io) return 0;

    const sockets = io.sockets.adapter.rooms.get(
        role ? `role:${role}` : "all"
    );
    return sockets ? sockets.size : 0;
}

/**
 * Khởi tạo Socket.IO server và gắn vào HTTP server.
 *
 * @param {import('http').Server} httpServer
 */
function attach(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL
                ? process.env.CLIENT_URL.split(",").map((u) => u.trim())
                : true,
            credentials: true,
        },
        path: "/socket.io",
    });

    // Middleware xác thực: chỉ cho phép user đã đăng nhập kết nối.
    io.use((socket, next) => {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
            socket.handshake.query?.token;

        if (!token) {
            return next(new Error("UNAUTHORIZED"));
        }

        try {
            const decoded = JwtUtils.verifyToken(token);

            if (decoded.status && decoded.status !== "ACTIVE") {
                return next(new Error("ACCOUNT_INACTIVE"));
            }

            socket.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };

            return next();
        } catch {
            return next(new Error("UNAUTHORIZED"));
        }
    });

    io.on("connection", (socket) => {
        const { id, role } = socket.user;

        socket.join(`user:${id}`);
        socket.join(`role:${role}`);
        socket.join("all");

        // Gửi số người đang online cho client (có thể dùng cho badge admin)
        socket.emit("notification:online", {
            online: getOnlineCount(),
        });
        socket.broadcast.emit("notification:online", {
            online: getOnlineCount(),
        });

        // Client có thể chủ động yêu cầu số thông báo chưa đọc khi kết nối
        socket.on("notification:sync", async (ack) => {
            try {
                const notificationService = require("./notification.service");
                const unreadCount = await notificationService.countUnread(id);
                const result = { unreadCount };

                if (typeof ack === "function") ack(result);
                socket.emit("notification:sync", result);
            } catch (error) {
                if (typeof ack === "function") {
                    ack({ error: "SYNC_FAILED" });
                }
            }
        });

        socket.on("notification:read", async (payload, ack) => {
            try {
                const notificationService = require("./notification.service");
                const notificationId = payload?.id || null;
                await notificationService.markAsRead(id, notificationId);
                const unreadCount = await notificationService.countUnread(id);

                const result = { unreadCount };
                if (typeof ack === "function") ack(result);
                socket.emit("notification:read:result", result);
            } catch {
                if (typeof ack === "function") {
                    ack({ error: "UPDATE_FAILED" });
                }
            }
        });

        socket.on("disconnect", () => {
            socket.broadcast.emit("notification:online", {
                online: getOnlineCount(),
            });
        });
    });

    return io;
}

/**
 * Đóng server (dùng khi shutdown).
 */
async function close() {
    if (!io) return;
    await io.close();
    io = null;
}

module.exports = {
    attach,
    close,
    emitToUser,
    emitToRole,
    emitToAll,
    getOnlineCount,
    get io() {
        return io;
    },
};
