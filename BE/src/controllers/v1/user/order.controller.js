const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");
const orderService = require("../../../services/user/order.service");

exports.startBooking = asyncHandler(async (req, res) => {
    const result = await orderService.startBooking({ userId: req.user.id, eventId: req.body.eventId });
    return sendResponse(res, 201, "Đã bắt đầu lượt mua vé", result);
});

exports.cancel = asyncHandler(async (req, res) => {
    const result = await orderService.cancelOrder({ userId: req.user.id, orderId: req.params.id });
    return sendResponse(res, 200, "Đã cập nhật trạng thái đơn hàng", result);
});

exports.create = asyncHandler(async (req, res) => {
    const result = await orderService.createOrder({ ...req.body, userId: req.user.id });
    return sendResponse(res, 201, result.status === "PAID" ? "Đặt vé miễn phí thành công" : "Đã giữ vé đến khi lượt mua hết hạn", result);
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