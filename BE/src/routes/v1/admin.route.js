const express = require("express");
const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");

const adminDashboardController = require(
  "../../controllers/v1/admin/adminDashboard.controller"
);

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/dashboard", adminDashboardController.getDashboardData);

module.exports = router;