const express = require("express");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const controller = require("../../controllers/v1/wallet/wallet.controller");

const router = express.Router();

// Ví điện tử dùng chung cho cả 3 vai trò: USER / ORGANIZER / ADMIN.
// Việc kiểm tra cấu hình ví (bật/tắt, vai trò được phép) nằm ở service.
const walletOnly = [authenticate, authorize("USER", "ORGANIZER", "ADMIN")];

router.get("/providers", ...walletOnly, controller.listProviders);
router.get("/", ...walletOnly, controller.overview);
router.get("/accounts", ...walletOnly, controller.listAccounts);
router.post("/accounts", ...walletOnly, controller.linkAccount);
router.post("/accounts/:id/default", ...walletOnly, controller.setDefaultAccount);
router.delete("/accounts/:id", ...walletOnly, controller.unlinkAccount);
router.post("/topup", ...walletOnly, controller.topUp);
router.post("/withdraw", ...walletOnly, controller.withdraw);

module.exports = router;
