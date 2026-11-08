const express = require("express");
const router = express.Router();
const eventController = require("../../controllers/v1/event/event.controller");

/**
 * Public Event Routes - Đường dẫn sự kiện công khai (không yêu cầu đăng nhập)
 */

// Lấy danh sách sự kiện kèm theo tìm kiếm, lọc, phân trang
router.get("/", eventController.getEvents);

// Lấy danh sách sự kiện nổi bật (phục vụ HomePage, Banner)
router.get("/featured", eventController.getFeaturedEvents);

// Lấy danh sách sự kiện sắp diễn ra
router.get("/upcoming", eventController.getUpcomingEvents);

// Xem chi tiết sự kiện theo ID (ObjectId) hoặc Slug
router.get("/:idOrSlug", eventController.getEventDetail);

module.exports = router;

