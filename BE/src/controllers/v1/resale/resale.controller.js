const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");
const resaleService = require("../../../services/resale/resale.service");

class ResaleController {
    constructor(service = resaleService) {
        this.resaleService = service;
    }

    // Lấy danh sách vé đang được bán lại
    list = asyncHandler(async (req, res) => {
        const result = await this.resaleService.listListings({
            page: req.query.page,
            pageSize: req.query.pageSize,
            eventId: req.query.eventId,
            keyword: req.query.keyword,
        });

        return sendResponse(
            res,
            200,
            "Lấy danh sách vé bán lại thành công",
            result
        );
    });

    // Lấy danh sách sự kiện đang có vé bán lại
    events = asyncHandler(async (req, res) => {
        const result = await this.resaleService.listResaleEvents({
            page: req.query.page,
            pageSize: req.query.pageSize,
            keyword: req.query.keyword,
            categoryId: req.query.categoryId,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
        });

        return sendResponse(
            res,
            200,
            "Lấy danh sách sự kiện có vé bán lại thành công",
            result
        );
    });

    // Lấy chi tiết tin bán vé
    get = asyncHandler(async (req, res) => {
        const result = await this.resaleService.getListing({
            resaleId: req.params.id,
            // req.user có thể undefined (khách chưa đăng nhập)
            userId: req.user?.id,
        });

        return sendResponse(
            res,
            200,
            "Lấy tin bán vé thành công",
            result
        );
    });

    // Lấy danh sách vé của bản thân có thể bán lại
    myTickets = asyncHandler(async (req, res) => {
        const result = await this.resaleService.listMyTickets({
            userId: req.user.id,
            page: req.query.page,
            pageSize: req.query.pageSize,
        });

        return sendResponse(
            res,
            200,
            "Lấy vé có thể bán lại thành công",
            result
        );
    });

    // Lấy toàn bộ vé đang sở hữu kèm trạng thái bán lại
    ownedTickets = asyncHandler(async (req, res) => {
        const result = await this.resaleService.listMyOwnedTickets({
            userId: req.user.id,
            page: req.query.page,
            pageSize: req.query.pageSize,
        });

        return sendResponse(
            res,
            200,
            "Lấy danh sách vé của bạn thành công",
            result
        );
    });

    // Lấy danh sách tin bán của bản thân
    mine = asyncHandler(async (req, res) => {
        const result = await this.resaleService.listMine({
            userId: req.user.id,
            page: req.query.page,
            pageSize: req.query.pageSize,
        });

        return sendResponse(
            res,
            200,
            "Lấy tin bán của bạn thành công",
            result
        );
    });

    // Đăng tin bán vé
    create = asyncHandler(async (req, res) => {
        const result = await this.resaleService.createListing({
            userId: req.user.id,
            ticketId: req.body.ticketId,
            price: req.body.price,
        });

        return sendResponse(
            res,
            201,
            "Đăng bán vé thành công",
            result
        );
    });

    // Hủy tin bán vé
    cancel = asyncHandler(async (req, res) => {
        const result = await this.resaleService.cancelListing({
            userId: req.user.id,
            resaleId: req.params.id,
        });

        return sendResponse(
            res,
            200,
            "Đã hủy tin bán vé",
            result
        );
    });

    // Mua lại vé - tạo đơn hàng thanh toán
    purchase = asyncHandler(async (req, res) => {
        const result = await this.resaleService.purchaseListing({
            userId: req.user.id,
            resaleId: req.params.id,
            method: req.body?.method,
        });

        return sendResponse(
            res,
            201,
            "Tạo đơn mua vé bán lại thành công",
            result
        );
    });

    // Lấy chi tiết đơn mua vé bán lại
    purchaseOrder = asyncHandler(async (req, res) => {
        const result = await this.resaleService.getPurchaseOrder({
            userId: req.user.id,
            orderId: req.params.orderId,
        });

        return sendResponse(
            res,
            200,
            "Lấy thông tin đơn mua vé bán lại thành công",
            result
        );
    });

    // Khởi tạo thanh toán đơn mua vé bán lại qua cổng SePay
    checkoutPurchaseOrder = asyncHandler(async (req, res) => {
        const result = await this.resaleService.checkoutPurchaseOrder({
            userId: req.user.id,
            orderId: req.params.orderId,
        });

        return sendResponse(
            res,
            200,
            "Khởi tạo thanh toán thành công",
            result
        );
    });

    // Thanh toán đơn mua vé bán lại bằng ví điện tử
    payPurchaseOrderWithWallet = asyncHandler(async (req, res) => {
        const result = await this.resaleService.payPurchaseOrderWithWallet({
            userId: req.user.id,
            orderId: req.params.orderId,
        });

        return sendResponse(
            res,
            200,
            "Thanh toán bằng ví điện tử thành công",
            result
        );
    });

    // Hủy đơn mua vé bán lại
    cancelPurchaseOrder = asyncHandler(async (req, res) => {
        const result = await this.resaleService.cancelPurchaseOrder({
            userId: req.user.id,
            orderId: req.params.orderId,
        });

        return sendResponse(
            res,
            200,
            "Đã hủy đơn mua vé bán lại",
            result
        );
    });

    // Lấy danh sách vé đã mua lại
    purchases = asyncHandler(async (req, res) => {
        const result = await this.resaleService.listPurchases({
            userId: req.user.id,
            page: req.query.page,
            pageSize: req.query.pageSize,
        });

        return sendResponse(
            res,
            200,
            "Lấy vé đã mua lại thành công",
            result
        );
    });
}

module.exports = new ResaleController();