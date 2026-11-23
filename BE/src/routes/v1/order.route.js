const express = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const controller = require("../../controllers/v1/user/order.controller");
const orderError = require("../../middlewares/order-error.middleware");

const router = express.Router();
router.use(authenticate);
router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.get);
router.post("/:id/checkout", controller.checkout);
router.use(orderError);

module.exports = router;
