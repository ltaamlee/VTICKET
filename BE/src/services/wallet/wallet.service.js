const prisma = require("../../config/prisma");
const notificationService = require("../notification/notification.service");
const {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} = require("../../exceptions");

const OBJECT_ID = /^[a-f\d]{24}$/i;
const MAX_TOPUP = 100_000_000;
const MAX_WITHDRAW = 100_000_000;

// Cấu hình mặc định của ví điện tử.
// `allowedRoles` : các vai trò được phép dùng ví.
// `allowWithdraw`: cho phép rút tiền về tài khoản đã liên kết.
const DEFAULT_WALLET_SETTINGS = {
    enabled: true,
    allowWalletPayment: true,
    allowWithdraw: true,
    minTopUp: 10_000,
    maxTopUp: 100_000_000,
    minWithdraw: 10_000,
    maxWithdraw: 100_000_000,
    allowedRoles: ["USER", "ORGANIZER", "ADMIN"],
};

// Danh sách nhà cung cấp ví điện tử được hỗ trợ
const SUPPORTED_PROVIDERS = ["MOMO", "VNPAY", "PAYOS", "ZALOPAY", "BANK", "SEPAY"];

const PROVIDER_META = {
    MOMO: { name: "MoMo", logo: "/images/payment/momo.png", color: "#D82C20" },
    VNPAY: { name: "VNPay", logo: "/images/payment/vnpay.png", color: "#002478" },
    PAYOS: { name: "PayOS", logo: "/images/payment/payos.png", color: "#0F172A" },
    ZALOPAY: { name: "ZaloPay", logo: null, color: "#0068FF" },
    BANK: { name: "Ngân hàng", logo: null, color: "#2563EB" },
    SEPAY: { name: "SePay", logo: null, color: "#0F766E" },
};

class WalletService {
    constructor(prismaClient = prisma) {
        this.prisma = prismaClient;
    }

    assertId(id, label = "ID") {
        if (typeof id !== "string" || !OBJECT_ID.test(id)) {
            throw new BadRequestException(`${label} không hợp lệ`);
        }
    }

    /**
     * Gửi thông báo realtime về giao dịch ví.
     * Lỗi thông báo không được làm fail luồng giao dịch.
     * @private
     */
    async _notifyWallet({ type, userId, amount, title, body, metadata }) {
        try {
            await notificationService.notify({
                type,
                userId,
                title,
                body,
                link: "/wallet",
                metadata: {
                    ...(metadata || {}),
                    amount,
                    formattedAmount: new Intl.NumberFormat("vi-VN").format(
                        Number(amount) || 0
                    ),
                },
            });
        } catch (error) {
            console.error("[Notification] Gửi thông báo ví lỗi:", error.code || error.name || error.message);
        }
    }

    /**
     * Lấy (hoặc tạo) ví của người dùng.
     */
    async getOrCreateWallet(userId) {
        this.assertId(userId, "ID người dùng");

        const existing = await this.prisma.wallet.findUnique({
            where: { userId },
        });

        if (existing) return existing;

        try {
            return await this.prisma.wallet.create({
                data: { userId },
            });
        } catch (error) {
            // Có thể do race condition tạo ví song song -> lấy lại
            const wallet = await this.prisma.wallet.findUnique({
                where: { userId },
            });
            if (wallet) return wallet;
            throw error;
        }
    }

    /**
     * Lấy cấu hình ví điện tử từ SystemSetting (payment.wallet).
     */
    async getWalletSettings() {
        try {
            const setting = await this.prisma.systemSetting.findUnique({
                where: { key: "payment" },
            });

            const wallet = setting?.value?.wallet;

            if (!wallet || typeof wallet !== "object") {
                return { ...DEFAULT_WALLET_SETTINGS };
            }

            return {
                enabled: wallet.enabled !== false,
                allowWalletPayment: wallet.allowWalletPayment !== false,
                allowWithdraw: wallet.allowWithdraw !== false,
                minTopUp: Number.isFinite(Number(wallet.minTopUp))
                    ? Number(wallet.minTopUp)
                    : DEFAULT_WALLET_SETTINGS.minTopUp,
                maxTopUp: Number.isFinite(Number(wallet.maxTopUp))
                    ? Number(wallet.maxTopUp)
                    : DEFAULT_WALLET_SETTINGS.maxTopUp,
                minWithdraw: Number.isFinite(Number(wallet.minWithdraw))
                    ? Number(wallet.minWithdraw)
                    : DEFAULT_WALLET_SETTINGS.minWithdraw,
                maxWithdraw: Number.isFinite(Number(wallet.maxWithdraw))
                    ? Number(wallet.maxWithdraw)
                    : DEFAULT_WALLET_SETTINGS.maxWithdraw,
                allowedRoles: Array.isArray(wallet.allowedRoles)
                    ? wallet.allowedRoles
                    : [...DEFAULT_WALLET_SETTINGS.allowedRoles],
            };
        } catch {
            return { ...DEFAULT_WALLET_SETTINGS };
        }
    }

    /**
     * Kiểm tra vai trò của người dùng có được phép dùng ví hay không.
     */
    async canUseWallet(userId, role) {
        const settings = await this.getWalletSettings();

        if (!settings.enabled) {
            throw new BadRequestException(
                "Ví điện tử hiện đang tạm ngưng. Vui lòng thử lại sau."
            );
        }

        const allowedRoles = settings.allowedRoles || [];
        if (role && allowedRoles.length && !allowedRoles.includes(role)) {
            throw new ForbiddenException(
                "Tài khoản của bạn không được phép sử dụng ví điện tử."
            );
        }

        return settings;
    }

    /**
     * Thông tin ví kèm tài khoản liên kết và lịch sử giao dịch gần đây.
     */
    async getWalletOverview({ userId, role, page, pageSize }) {
        this.assertId(userId, "ID người dùng");

        const currentPage = Math.max(1, Math.floor(Number(page) || 1));
        const size = Math.min(50, Math.max(1, Math.floor(Number(pageSize) || 10)));
        const skip = (currentPage - 1) * size;

        const settings = await this.canUseWallet(userId, role);
        const wallet = await this.getOrCreateWallet(userId);

        const [accounts, transactions, total] = await Promise.all([
            this.prisma.walletAccount.findMany({
                where: { userId },
                orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
            }),
            this.prisma.walletTransaction.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                skip,
                take: size,
            }),
            this.prisma.walletTransaction.count({ where: { userId } }),
        ]);

        return {
            wallet: {
                id: wallet.id,
                balance: wallet.balance,
                frozenAmount: wallet.frozenAmount,
                availableBalance: Math.max(0, wallet.balance - wallet.frozenAmount),
                currency: wallet.currency,
                status: wallet.status,
                updatedAt: wallet.updatedAt,
            },
            settings,
            accounts: accounts.map((account) => this.mapAccount(account)),
            transactions: transactions.map((tx) => this.mapTransaction(tx)),
            pagination: {
                currentPage,
                pageSize: size,
                total,
                totalPages: Math.ceil(total / size),
            },
        };
    }

    /**
     * Danh sách tài khoản thanh toán liên kết của người dùng.
     */
    async listAccounts(userId) {
        this.assertId(userId, "ID người dùng");

        const accounts = await this.prisma.walletAccount.findMany({
            where: { userId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        });

        return accounts.map((account) => this.mapAccount(account));
    }

    /**
     * Liên kết một tài khoản thanh toán (MoMo / VNPay / PayOS / ngân hàng).
     */
    async linkAccount({ userId, role, provider, identifier, nickname, isDefault }) {
        this.assertId(userId, "ID người dùng");

        await this.canUseWallet(userId, role);

        const normalizedProvider = String(provider || "").toUpperCase().trim();
        if (!SUPPORTED_PROVIDERS.includes(normalizedProvider)) {
            throw new BadRequestException("Nhà cung cấp tài khoản không được hỗ trợ");
        }

        const cleanIdentifier = String(identifier || "").trim();
        if (!cleanIdentifier) {
            throw new BadRequestException("Vui lòng nhập số điện thoại hoặc email của tài khoản");
        }

        const wallet = await this.getOrCreateWallet(userId);

        const duplicated = await this.prisma.walletAccount.findFirst({
            where: {
                userId,
                provider: normalizedProvider,
                identifier: cleanIdentifier,
                status: { not: "DISABLED" },
            },
        });

        if (duplicated) {
            throw new ConflictException("Tài khoản này đã được liên kết với ví của bạn");
        }

        if (isDefault) {
            await this.prisma.walletAccount.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }

        const account = await this.prisma.walletAccount.create({
            data: {
                walletId: wallet.id,
                userId,
                provider: normalizedProvider,
                identifier: cleanIdentifier,
                nickname: nickname?.trim() || null,
                isDefault: Boolean(isDefault),
                // Tài khoản mới liên kết được đánh dấu PENDING cho tới khi
                // được xác thực qua luồng OTP của nhà cung cấp.
                status: "PENDING",
            },
        });

        return this.mapAccount(account);
    }

    /**
     * Đặt tài khoản mặc định.
     */
    async setDefaultAccount({ userId, accountId }) {
        this.assertId(userId, "ID người dùng");
        this.assertId(accountId, "ID tài khoản");

        const account = await this.prisma.walletAccount.findFirst({
            where: { id: accountId, userId },
        });

        if (!account) throw new NotFoundException("Không tìm thấy tài khoản");

        await this.prisma.$transaction([
            this.prisma.walletAccount.updateMany({
                where: { userId },
                data: { isDefault: false },
            }),
            this.prisma.walletAccount.update({
                where: { id: accountId },
                data: { isDefault: true },
            }),
        ]);

        return this.mapAccount({ ...account, isDefault: true });
    }

    /**
     * Gỡ liên kết tài khoản.
     */
    async unlinkAccount({ userId, accountId }) {
        this.assertId(userId, "ID người dùng");
        this.assertId(accountId, "ID tài khoản");

        const account = await this.prisma.walletAccount.findFirst({
            where: { id: accountId, userId },
        });

        if (!account) throw new NotFoundException("Không tìm thấy tài khoản");

        await this.prisma.walletAccount.update({
            where: { id: accountId },
            data: { status: "DISABLED", isDefault: false },
        });

        return { id: accountId, status: "DISABLED" };
    }

    /**
     * Nạp tiền vào ví từ tài khoản liên kết.
     *
     * Trong môi trường thực tế, bước này sẽ được gọi từ IPN/webhook của
     * nhà cung cấp. Ở đây ta ghi nhận giao dịch ngay để luồng hoạt động
     * đầy đủ trong phạm vi dự án.
     */
    async topUp({ userId, role, accountId, amount, transactionRef, description }) {
        this.assertId(userId, "ID người dùng");
        this.assertId(accountId, "ID tài khoản");

        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            throw new BadRequestException("Số tiền nạp không hợp lệ");
        }

        const settings = await this.canUseWallet(userId, role);

        if (numericAmount < settings.minTopUp) {
            throw new BadRequestException(
                `Số tiền nạp tối thiểu là ${settings.minTopUp.toLocaleString("vi-VN")} đ`
            );
        }

        if (numericAmount > Math.min(settings.maxTopUp, MAX_TOPUP)) {
            throw new BadRequestException(
                `Số tiền nạp tối đa là ${Math.min(settings.maxTopUp, MAX_TOPUP).toLocaleString("vi-VN")} đ`
            );
        }

        const account = await this.prisma.walletAccount.findFirst({
            where: { id: accountId, userId, status: { not: "DISABLED" } },
        });

        if (!account) throw new NotFoundException("Không tìm thấy tài khoản liên kết");

        if (transactionRef) {
            const duplicated = await this.prisma.walletTransaction.findFirst({
                where: { transactionRef },
            });
            if (duplicated) {
                throw new ConflictException("Giao dịch nạp tiền đã được ghi nhận");
            }
        }

        const wallet = await this.getOrCreateWallet(userId);

        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: numericAmount } },
            });

            return tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    userId,
                    type: "TOPUP",
                    status: "SUCCESS",
                    amount: numericAmount,
                    balanceBefore: updated.balance - numericAmount,
                    balanceAfter: updated.balance,
                    transactionRef: transactionRef || null,
                    description: description || `Nạp tiền từ ${PROVIDER_META[account.provider]?.name || account.provider}`,
                },
            });
        }).then((tx) => this.mapTransaction(tx)).then(async (mapped) => {
            // Thông báo realtime nạp tiền thành công (nếu cấu hình cho phép)
            await this._notifyWallet({
                type: "WALLET_TOPUP",
                userId,
                amount: numericAmount,
                title: "Nạp tiền vào ví thành công",
                body: `Bạn đã nạp ${new Intl.NumberFormat("vi-VN").format(numericAmount)} đ vào ví điện tử. Số dư hiện tại: ${new Intl.NumberFormat("vi-VN").format(mapped.balanceAfter ?? 0)} đ.`,
                metadata: { balanceAfter: mapped.balanceAfter },
            });

            return mapped;
        });
    }

    /**
     * Rút tiền từ ví về tài khoản ngân hàng / ví điện tử đã liên kết.
     *
     * Số tiền được trừ ngay khỏi số dư khả dụng, giao dịch được ghi nhận
     * với trạng thái PENDING cho tới khi nhà cung cấp xác nhận chuyển khoản.
     */
    async withdraw({ userId, role, accountId, amount, note }) {
        this.assertId(userId, "ID người dùng");
        this.assertId(accountId, "ID tài khoản");

        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            throw new BadRequestException("Số tiền rút không hợp lệ");
        }

        const settings = await this.canUseWallet(userId, role);

        if (!settings.allowWithdraw) {
            throw new BadRequestException(
                "Tính năng rút tiền hiện đang tạm ngưng. Vui lòng thử lại sau."
            );
        }

        if (numericAmount < settings.minWithdraw) {
            throw new BadRequestException(
                `Số tiền rút tối thiểu là ${settings.minWithdraw.toLocaleString("vi-VN")} đ`
            );
        }

        if (numericAmount > Math.min(settings.maxWithdraw, MAX_WITHDRAW)) {
            throw new BadRequestException(
                `Số tiền rút tối đa là ${Math.min(settings.maxWithdraw, MAX_WITHDRAW).toLocaleString("vi-VN")} đ`
            );
        }

        const account = await this.prisma.walletAccount.findFirst({
            where: { id: accountId, userId, status: { not: "DISABLED" } },
        });

        if (!account) throw new NotFoundException("Không tìm thấy tài khoản nhận tiền");

        const wallet = await this.getOrCreateWallet(userId);

        const available = wallet.balance - wallet.frozenAmount;
        if (available < numericAmount) {
            throw new BadRequestException(
                "Số dư khả dụng trong ví không đủ để rút. Vui lòng kiểm tra lại số dư."
            );
        }

        const providerName =
            PROVIDER_META[account.provider]?.name || account.provider;

        return this.prisma.$transaction(async (tx) => {
            // Trừ tiền và ghi nhận giao dịch rút trong cùng transaction
            const updated = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: numericAmount } },
            });

            const transaction = await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    userId,
                    type: "WITHDRAW",
                    status: "PENDING",
                    amount: numericAmount,
                    balanceBefore: wallet.balance,
                    balanceAfter: updated.balance,
                    transactionRef: null,
                    description:
                        note?.trim() ||
                        `Rút tiền về tài khoản ${providerName} ${account.identifier}`,
                },
            });

            return this.mapTransaction(transaction);
        }).then(async (mapped) => {
            // Thông báo realtime yêu cầu rút tiền (nếu cấu hình cho phép)
            await this._notifyWallet({
                type: "WALLET_WITHDRAW",
                userId,
                amount: numericAmount,
                title: "Yêu cầu rút tiền đã được ghi nhận",
                body: `Yêu cầu rút ${new Intl.NumberFormat("vi-VN").format(numericAmount)} đ về tài khoản ${providerName} đang được xử lý.`,
                metadata: { provider: account.provider, identifier: account.identifier },
            });

            return mapped;
        });
    }

    /**
     * Trừ tiền khỏi ví (dùng cho giao dịch mua vé bán lại).
     * Phải được gọi trong transaction với thao tác trừ vé.
     */
    async debitInTransaction(tx, { userId, amount, resaleOrderId, description }) {
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            throw new BadRequestException("Số tiền thanh toán không hợp lệ");
        }

        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) {
            throw new BadRequestException("Bạn chưa có ví điện tử. Vui lòng nạp tiền trước.");
        }

        const available = wallet.balance - wallet.frozenAmount;
        if (available < numericAmount) {
            throw new BadRequestException(
                "Số dư ví không đủ. Vui lòng nạp thêm tiền vào ví điện tử."
            );
        }

        const updated = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: numericAmount } },
        });

        const transaction = await tx.walletTransaction.create({
            data: {
                walletId: wallet.id,
                userId,
                type: "PAYMENT",
                status: "SUCCESS",
                amount: numericAmount,
                balanceBefore: wallet.balance,
                balanceAfter: updated.balance,
                resaleOrderId: resaleOrderId || null,
                description: description || "Thanh toán mua vé bán lại",
            },
        });

        return { wallet: updated, transaction };
    }

    /**
     * Hoàn tiền vào ví (khi giao dịch bán lại bị hủy / hết hạn).
     */
    async creditInTransaction(tx, { userId, amount, resaleOrderId, description }) {
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            throw new BadRequestException("Số tiền hoàn không hợp lệ");
        }

        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) {
            throw new NotFoundException("Không tìm thấy ví của người dùng");
        }

        const updated = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: numericAmount } },
        });

        const transaction = await tx.walletTransaction.create({
            data: {
                walletId: wallet.id,
                userId,
                type: "REFUND",
                status: "SUCCESS",
                amount: numericAmount,
                balanceBefore: wallet.balance,
                balanceAfter: updated.balance,
                resaleOrderId: resaleOrderId || null,
                description: description || "Hoàn tiền giao dịch bán lại",
            },
        });

        return { wallet: updated, transaction };
    }

    mapAccount(account) {
        const meta = PROVIDER_META[account.provider] || {};

        return {
            id: account.id,
            provider: account.provider,
            providerName: meta.name || account.provider,
            providerLogo: meta.logo || null,
            providerColor: meta.color || "#2563EB",
            identifier: account.identifier,
            nickname: account.nickname,
            isDefault: account.isDefault,
            status: account.status,
            verifiedAt: account.verifiedAt,
            createdAt: account.createdAt,
        };
    }

    mapTransaction(transaction) {
        return {
            id: transaction.id,
            type: transaction.type,
            status: transaction.status,
            amount: transaction.amount,
            balanceBefore: transaction.balanceBefore,
            balanceAfter: transaction.balanceAfter,
            transactionRef: transaction.transactionRef,
            description: transaction.description,
            resaleOrderId: transaction.resaleOrderId,
            createdAt: transaction.createdAt,
        };
    }

    /**
     * Danh sách nhà cung cấp được hỗ trợ (dùng cho FE hiển thị logo).
     */
    listProviders() {
        return SUPPORTED_PROVIDERS.map((provider) => ({
            provider,
            ...PROVIDER_META[provider],
        }));
    }
}

module.exports = new WalletService();
module.exports.WalletService = WalletService;
module.exports.SUPPORTED_PROVIDERS = SUPPORTED_PROVIDERS;
module.exports.PROVIDER_META = PROVIDER_META;
