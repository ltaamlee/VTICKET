const express = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const controller = require("../../controllers/v1/notification/notification.controller");

const router = express.Router();

// Thông báo in-app dùng chung cho cả 3 vai trò: USER / ORGANIZER / ADMIN.
router.use(authenticate);

router.get("/", controller.list);
router.get("/unread-count", controller.unreadCount);
router.patch("/read-all", controller.markAllAsRead);
router.delete("/read-all", controller.clearRead);
router.patch("/:id/read", controller.markAsRead);
router.delete("/:id", controller.remove);

module.exports = router;
