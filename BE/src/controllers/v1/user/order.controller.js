const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");
const orderService = require("../../../services/user/order.service");

exports.create = asyncHandler(async (req, res) => {
    const result = await orderService.createOrder({ ...req.body, userId: req.user.id });
    return sendResponse(res, 201, result.status === "PAID" ? "Đặt vé miễn phí thành công" : "Đã giữ vé trong 15 phút", result);
});

exports.get = asyncHandler(async (req, res) => {
    const result = await orderService.getOrder({ userId: req.user.id, orderId: req.params.id });
    return sendResponse(res, 200, "Lấy thông tin đơn hàng thành công", result);
});

exports.list = asyncHandler(async (req, res) => {
    const result = await orderService.listOrders({ userId: req.user.id, page: req.query.page });
    return sendResponse(res, 200, "Lấy danh sách đơn hàng thành công", result);
});

exports.checkout = asyncHandler(async (req, res) => {
    const result = await orderService.checkout({ userId: req.user.id, orderId: req.params.id });
    return sendResponse(res, 200, "Khởi tạo thanh toán SePay thành công", result);
});