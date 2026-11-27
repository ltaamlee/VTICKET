const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");
const walletService = require("../../../services/wallet/wallet.service");

class WalletController {
    constructor(service = walletService) {
        this.walletService = service;
    }

    // Thông tin ví + tài khoản liên kết + lịch sử giao dịch
    overview = asyncHandler(async (req, res) => {
        const result = await this.walletService.getWalletOverview({
            userId: req.user.id,
            role: req.user.role,
            page: req.query.page,
            pageSize: req.query.pageSize,
        });

        return sendResponse(res, 200, "Lấy thông tin ví điện tử thành công", result);
    });
    // Danh sách tài khoản thanh toán liên kết
    listAccounts = asyncHandler(async (req, res) => {
        const result = await this.walletService.listAccounts(req.user.id);

        return sendResponse(res, 200, "Lấy danh sách tài khoản liên kết thành công", result);
    });

    // Danh sách nhà cung cấp ví hỗ trợ
    listProviders = asyncHandler(async (req, res) => {
        const result = this.walletService.listProviders();

        return sendResponse(res, 200, "Lấy danh sách nhà cung cấp thành công", result);
    });

    // Liên kết tài khoản thanh toán (MoMo, VNPay, PayOS, ngân hàng)
    linkAccount = asyncHandler(async (req, res) => {
        const result = await this.walletService.linkAccount({
            userId: req.user.id,
            role: req.user.role,
            provider: req.body?.provider,
            identifier: req.body?.identifier,
            nickname: req.body?.nickname,
            isDefault: req.body?.isDefault,
        });

        return sendResponse(res, 201, "Liên kết tài khoản thành công", result);
    });

    // Đặt tài khoản mặc định
    setDefaultAccount = asyncHandler(async (req, res) => {
        const result = await this.walletService.setDefaultAccount({
            userId: req.user.id,
            accountId: req.params.id,
        });

        return sendResponse(res, 200, "Đặt tài khoản mặc định thành công", result);
    });

    // Gỡ liên kết tài khoản
    unlinkAccount = asyncHandler(async (req, res) => {
        const result = await this.walletService.unlinkAccount({
            userId: req.user.id,
            accountId: req.params.id,
        });

        return sendResponse(res, 200, "Đã gỡ liên kết tài khoản", result);
    });

    // Nạp tiền vào ví từ tài khoản liên kết
    topUp = asyncHandler(async (req, res) => {
        const result = await this.walletService.topUp({
            userId: req.user.id,
            role: req.user.role,
            accountId: req.body?.accountId,
            amount: req.body?.amount,
            transactionRef: req.body?.transactionRef,
            description: req.body?.description,
        });

        return sendResponse(res, 201, "Nạp tiền vào ví thành công", result);
    });

    // Rút tiền về tài khoản ngân hàng / ví điện tử đã liên kết
    withdraw = asyncHandler(async (req, res) => {
        const result = await this.walletService.withdraw({
            userId: req.user.id,
            role: req.user.role,
            accountId: req.body?.accountId,
            amount: req.body?.amount,
            note: req.body?.note,
        });

        return sendResponse(res, 201, "Yêu cầu rút tiền đã được ghi nhận", result);
    });
}

module.exports = new WalletController();
