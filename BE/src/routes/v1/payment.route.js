const express = require("express");
const controller = require("../../controllers/v1/payment.controller");
const orderError = require("../../middlewares/order-error.middleware");

const router = express.Router();
router.post("/sepay/ipn", controller.sepayIpn);
router.use(orderError);

module.exports = router;