const express = require("express");
const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");

const adminDashboardController = require("../../controllers/v1/admin/adminDashboard.controller");
const adminUserController = require("../../controllers/v1/admin/adminUser.controller");
const adminCategoryController = require("../../controllers/v1/admin/adminCategory.controller");
const adminEventController = require("../../controllers/v1/admin/adminEvent.controller");
const adminSystemController = require("../../controllers/v1/admin/adminSystem.controller")
const adminOrganizerRequestController = require("../../controllers/v1/admin/adminOrganizerRequest.controller");

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/dashboard", adminDashboardController.getDashboardData);

// Users
router.get("/users", adminUserController.getUsers)
router.get("/user-stats", adminUserController.getUserStats);
router.put("/users/:id", adminUserController.updateUser);
router.delete("/users/:id", adminUserController.deleteUser);

// Categories
router.get("/categories", adminCategoryController.getCategories);
router.get("/categories/:id", adminCategoryController.getCategoryDetail)
router.post("/categories", adminCategoryController.createCategory)
router.put("/categories/:id", adminCategoryController.updateCategory)
router.delete("/categories/:id", adminCategoryController.deleteCategory)

// Events
// Event Management
router.get("/events/stats", adminEventController.getEventStats);
router.get("/events", adminEventController.getEvents);
router.get("/events/:id", adminEventController.getEventDetail);

router.patch("/events/:id/approve", adminEventController.approveEvent);
router.patch("/events/:id/reject", adminEventController.rejectEvent);
router.patch("/events/:id/suspend", adminEventController.suspendEvent);
router.patch("/events/:id/restore", adminEventController.restoreEvent);
router.patch("/events/:id/cancel", adminEventController.cancelEvent);

//System
router.get("/settings", adminSystemController.getSettings);
router.get("/settings/:key", adminSystemController.getSetting);
router.put("/settings/:key", adminSystemController.updateSetting);

// Quản lý đơn đăng ký Ban Tổ Chức
router.get("/organizer-requests/stats", adminOrganizerRequestController.getStats);
router.get("/organizer-requests", adminOrganizerRequestController.getRequests);
router.get("/organizer-requests/:id", adminOrganizerRequestController.getRequestDetail);
router.put("/organizer-requests/:id/approve", adminOrganizerRequestController.approveRequest);
router.put("/organizer-requests/:id/reject", adminOrganizerRequestController.rejectRequest);

module.exports = router;