const asyncHandler = require("../../utils/asyncHandler");
const paymentService = require("../../services/payment/payment.service");

exports.sepayIpn = asyncHandler(async (req, res) => {
    await paymentService.handleIpn(req.body, req.get("X-Secret-Key"));
    return res.status(200).json({ success: true });
});