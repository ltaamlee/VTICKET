/**
 * Notification Controller
 *
 * REST API cho hệ thống thông báo in-app.
 * Realtime được đẩy qua Socket.IO (xem notification.realtime.js),
 * các endpoint này phục vụ việc đọc lại lịch sử và đồng bộ trạng thái đã đọc.
 */

const notificationService = require("../../../services/notification/notification.service");
const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");

class NotificationController {
    constructor(service = notificationService) {
        this.notificationService = service;
    }

    /**
     * GET /api/v1/notifications
     * Danh sách thông báo (có phân trang).
     */
    list = asyncHandler(async (req, res) => {
        const { page, pageSize, status } = req.query;

        const result = await this.notificationService.list(req.user.id, {
            page,
            pageSize,
            status,
        });

        return sendResponse(
            res,
            200,
            "Lấy danh sách thông báo thành công",
            result
        );
    });

    /**
     * GET /api/v1/notifications/unread-count
     */
    unreadCount = asyncHandler(async (req, res) => {
        const unreadCount = await this.notificationService.countUnread(
            req.user.id
        );

        return sendResponse(res, 200, "Lấy số thông báo chưa đọc thành công", {
            unreadCount,
        });
    });

    /**
     * PATCH /api/v1/notifications/:id/read
     * Đánh dấu đã đọc một thông báo.
     */
    markAsRead = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const updated = await this.notificationService.markAsRead(
            req.user.id,
            id
        );
        const unreadCount = await this.notificationService.countUnread(
            req.user.id
        );

        return sendResponse(
            res,
            200,
            updated > 0
                ? "Đánh dấu thông báo đã đọc thành công"
                : "Thông báo không tồn tại hoặc đã đọc",
            { updated, unreadCount }
        );
    });

    /**
     * PATCH /api/v1/notifications/read-all
     * Đánh dấu toàn bộ thông báo đã đọc.
     */
    markAllAsRead = asyncHandler(async (req, res) => {
        const updated = await this.notificationService.markAsRead(req.user.id);
        const unreadCount = await this.notificationService.countUnread(
            req.user.id
        );

        return sendResponse(
            res,
            200,
            "Đánh dấu toàn bộ thông báo đã đọc thành công",
            { updated, unreadCount }
        );
    });

    /**
     * DELETE /api/v1/notifications/:id
     */
    remove = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const removed = await this.notificationService.remove(req.user.id, id);

        if (!removed) {
            return sendResponse(
                res,
                404,
                "Không tìm thấy thông báo để xóa"
            );
        }

        const unreadCount = await this.notificationService.countUnread(
            req.user.id
        );

        return sendResponse(res, 200, "Xóa thông báo thành công", { unreadCount });
    });

    /**
     * DELETE /api/v1/notifications/read-all
     * Xóa toàn bộ thông báo đã đọc.
     */
    clearRead = asyncHandler(async (req, res) => {
        const deleted = await this.notificationService.clearRead(req.user.id);
        const unreadCount = await this.notificationService.countUnread(
            req.user.id
        );

        return sendResponse(
            res,
            200,
            "Xóa toàn bộ thông báo đã đọc thành công",
            { deleted, unreadCount }
        );
    });
}

module.exports = new NotificationController();
