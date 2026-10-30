const express = require("express");
const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");

const adminDashboardController = require("../../controllers/v1/admin/adminDashboard.controller");
const adminUserController = require("../../controllers/v1/admin/adminUser.controller");
const adminCategoryController = require("../../controllers/v1/admin/adminCategory.controller");
const adminSystemController = require("../../controllers/v1/admin/adminSystem.controller")
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

//System
router.get("/settings", adminSystemController.getSettings);
router.get("/settings/:key", adminSystemController.getSetting);
router.put("/settings/:key", adminSystemController.updateSetting);

module.exports = router;