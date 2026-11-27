const express = require("express");
const {
    authenticate,
    optionalAuthenticate,
    authorize,
} = require("../../middlewares/auth.middleware");
const customerMiddleware = require("../../middlewares/customer.middleware");
const controller = require("../../controllers/v1/resale/resale.controller");
const orderError = require("../../middlewares/order-error.middleware");

const router = express.Router();

const customerOnly = [
    authenticate,
    authorize("USER"),
    customerMiddleware.verifyActiveCustomer,
];

// Customer routes
// NOTE: phải khai báo TRƯỚC "/:id" để không bị route động nuốt mất.
router.get("/tickets/mine", ...customerOnly, controller.myTickets);
router.get("/tickets/owned", ...customerOnly, controller.ownedTickets);
router.get("/mine", ...customerOnly, controller.mine);
router.get("/purchases", ...customerOnly, controller.purchases);

router.post("/", ...customerOnly, controller.create);
router.post("/:id/purchase", ...customerOnly, controller.purchase);
router.post("/:id/cancel", ...customerOnly, controller.cancel);

// Đơn mua vé bán lại (thanh toán qua cổng SePay hoặc ví điện tử)
router.get("/orders/:orderId", ...customerOnly, controller.purchaseOrder);
router.post("/orders/:orderId/checkout", ...customerOnly, controller.checkoutPurchaseOrder);
router.post("/orders/:orderId/pay-wallet", ...customerOnly, controller.payPurchaseOrderWithWallet);
router.post("/orders/:orderId/cancel", ...customerOnly, controller.cancelPurchaseOrder);

// Public routes
router.get("/", controller.list);
// Danh sách sự kiện đang có vé bán lại (trang sàn vé bán lại hiển thị card sự kiện).
// Phải khai báo TRƯỚC "/:id" để không bị route động nuốt mất.
router.get("/events", controller.events);
// optionalAuthenticate: chủ vé đăng nhập sẽ thấy mã vé của mình trên trang chi tiết.
router.get("/:id", optionalAuthenticate, controller.get);

// Error handling
router.use(orderError);

module.exports = router;
