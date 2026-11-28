const { AppException } = require("../exceptions");

module.exports = (error, req, res, next) => {
    if (error instanceof AppException) return next(error);
    const code = typeof error.code === "string" && /^P\d{4}$/.test(error.code)
        ? error.code
        : "INTERNAL_ERROR";
    console.error("[Đơn hàng/SePay] Lỗi xử lý:", code);
    return next(new AppException("Không thể xử lý đơn hàng, vui lòng thử lại", 500));
};
