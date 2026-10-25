const express = require("express");
const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");

const adminDashboardController = require("../../controllers/v1/admin/adminDashboard.controller");
const adminUserController = require("../../controllers/v1/admin/adminUser.controller")
router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/dashboard", adminDashboardController.getDashboardData);
router.get("/users", adminUserController.getUsers)
router.get("/user-stats", adminUserController.getUserStats);
router.put("/users/:id", adminUserController.updateUser);
router.delete("/users/:id", adminUserController.deleteUser);



module.exports = router;