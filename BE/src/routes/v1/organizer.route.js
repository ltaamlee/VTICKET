const express = require("express");
const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");

const organizerRequestController = require("../../controllers/v1/organizer/organizerRequest.controller");

// ==========================================
// 1. NHÓM ĐĂNG KÝ LÀM BAN TỔ CHỨC (Cần đăng nhập)
// ==========================================
router.post("/register", authenticate, organizerRequestController.createRequest);
router.post("/requests", authenticate, organizerRequestController.createRequest);
router.get("/my-request", authenticate, organizerRequestController.getMyRequest);
router.put("/my-request/:id", authenticate, organizerRequestController.updateMyRequest);
router.delete("/my-request/:id", authenticate, organizerRequestController.cancelMyRequest);

// ==========================================
// 2. NHÓM CHỨC NĂNG DÀNH CHO ORGANIZER (Role: ORGANIZER)
// ==========================================
// router.use(authenticate);
// router.use(authorize("ORGANIZER"));
// router.get("/dashboard", organizerDashboardController.getDashboardData);
// router.get("/events", organizerEventController.getEvents);

module.exports = router;