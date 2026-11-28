
const prisma = require("../../config/prisma");

const DEFAULT_SETTINGS = {
    general: {
        title: "VTicket",
        logoUrl: "",
        supportEmail: "",
        theme: "light",
        primaryColor: "#2563EB",
        defaultPageSize: 10,
    },

    localization: {
        defaultLanguage: "vi",
        supportedLanguages: ["vi", "en"],
    },

    appearance: {
        theme: "light",
        primaryColor: "#2563EB",
        logoUrl: "",
    },

    security: {
        password: {
            minLength: 8,
            requireUppercase: true,
            requireNumber: true,
            requireSpecialChar: false,
        },
        loginProtection: {
            maxFailedAttempts: 5,
            lockoutDuration: 15,
        },
        session: {
            sessionTimeout: 60,
        },
    },

    // Thong bao: chi con phan CO BAN (kenh gui).
    // Khong co danh muc loai thong bao co dinh - moi loai thong bao deu
    // duoc gui ngay lap tuc, khong bieu kien gi.
    notification: {
        channels: {
            email: true,
            inApp: true,
        },
    },

    payment: {
        environment: "SANDBOX",
        platformFeeRate: 2,
        providers: {
            SEPAY: { enabled: true, displayName: "SePay", logo: null },
            MOMO: { enabled: false, displayName: "MoMo", logo: "/images/payment/momo.png" },
            VNPAY: { enabled: false, displayName: "VNPay", logo: "/images/payment/vnpay.png" },
            PAYOS: { enabled: false, displayName: "PayOS", logo: "/images/payment/payos.png" },
        },
        wallet: {
            enabled: true,
            minTopUp: 10_000,
            maxTopUp: 100_000_000,
            allowWalletPayment: true,
            allowWithdraw: true,
            minWithdraw: 10_000,
            maxWithdraw: 100_000_000,
            allowedRoles: ["USER", "ORGANIZER", "ADMIN"],
        },
    },
};

class AdminSystemService {
    // Lấy toàn bộ cấu hình
    async getSettings() {
        const settings = await prisma.systemSetting.findMany();

        const result = { ...DEFAULT_SETTINGS };

        for (const setting of settings) {
            if (Object.hasOwn(DEFAULT_SETTINGS, setting.key)) {
                const defaultValue = DEFAULT_SETTINGS[setting.key];
                const value = setting.value || {};

                if (setting.key === "payment") {
                    result.payment = {
                        ...defaultValue,
                        ...value,
                        providers: {
                            ...defaultValue.providers,
                            ...(value.providers || {}),
                        },
                        wallet: {
                            ...defaultValue.wallet,
                            ...(value.wallet || {}),
                        },
                    };
                    continue;
                }

                // Thong bao: chi tra ve phan CO BAN (kenh gui).
                // Bo qua "events" cu (khong con dung dau).
                if (setting.key === "notification") {
                    result.notification = {
                        channels: {
                            ...defaultValue.channels,
                            ...(value.channels || {}),
                        },
                    };
                    continue;
                }

                result[setting.key] = value;
            }
        }

        return result;
    }

    // Lấy cấu hình theo nhóm
    async getSetting(key) {
        if (!Object.hasOwn(DEFAULT_SETTINGS, key)) {
            const error = new Error("Nhóm cấu hình không tồn tại.");
            error.statusCode = 404;
            throw error;
        }

        const setting = await prisma.systemSetting.findUnique({
            where: { key },
        });

        if (!setting) return DEFAULT_SETTINGS[key];

        if (key === "payment") {
            return {
                ...DEFAULT_SETTINGS.payment,
                ...setting.value,
                providers: {
                    ...DEFAULT_SETTINGS.payment.providers,
                    ...(setting.value?.providers || {}),
                },
                wallet: {
                    ...DEFAULT_SETTINGS.payment.wallet,
                    ...(setting.value?.wallet || {}),
                },
            };
        }

        // Thong bao: chi phan CO BAN (kenh gui), bo qua "events" cu.
        if (key === "notification") {
            return {
                channels: {
                    ...DEFAULT_SETTINGS.notification.channels,
                    ...(setting.value?.channels || {}),
                },
            };
        }

        return setting.value;
    }

    // Cập nhật cấu hình
    async updateSetting(key, value) {
        if (!Object.hasOwn(DEFAULT_SETTINGS, key)) {
            const error = new Error("Nhóm cấu hình không tồn tại.");
            error.statusCode = 404;
            throw error;
        }

        if (
            !value ||
            typeof value !== "object" ||
            Array.isArray(value)
        ) {
            const error = new Error("Dữ liệu cấu hình không hợp lệ.");
            error.statusCode = 400;
            throw error;
        }

        this.validateSetting(key, value);

        const currentSetting = await prisma.systemSetting.findUnique({
            where: { key },
        });

        const currentValue =
            currentSetting?.value ?? DEFAULT_SETTINGS[key];

        const mergedValue = {
            ...currentValue,
            ...value,
        };

        // Merge cấu hình thanh toán
        if (key === "payment") {
            const currentProviders = currentValue.providers || {};
            const nextProviders = {};

            for (const providerKey of new Set([
                ...Object.keys(currentProviders),
                ...Object.keys(value.providers || {}),
            ])) {
                nextProviders[providerKey] = {
                    ...(currentProviders[providerKey] || {}),
                    ...((value.providers || {})[providerKey] || {}),
                };
            }

            mergedValue.providers = nextProviders;

            mergedValue.wallet = {
                ...(currentValue.wallet || {}),
                ...(value.wallet || {}),
            };
        }

        // Merge cấu hình bảo mật
        if (key === "security") {
            mergedValue.password = {
                ...currentValue.password,
                ...(value.password || {}),
            };

            mergedValue.loginProtection = {
                ...currentValue.loginProtection,
                ...(value.loginProtection || {}),
            };

            mergedValue.session = {
                ...currentValue.session,
                ...(value.session || {}),
            };
        }

        // Merge cau hinh thong bao (chi co kenh gui)
        if (key === "notification") {
            mergedValue.channels = {
                ...currentValue.channels,
                ...(value.channels || {}),
            };

            // Xoa "events" cu (khong con dung dau).
            delete mergedValue.events;
        }

        return prisma.systemSetting.upsert({
            where: { key },
            update: {
                value: mergedValue,
            },
            create: {
                key,
                value: mergedValue,
            },
        });
    }

    // Kiểm tra dữ liệu cấu hình
    validateSetting(key, value) {
        // GENERAL
        if (key === "general") {
            const {
                title,
                logoUrl,
                supportEmail,
                theme,
                primaryColor,
                defaultPageSize,
            } = value;

            if (
                title !== undefined &&
                typeof title !== "string"
            ) {
                throw this.validationError(
                    "Tên website không hợp lệ."
                );
            }

            if (
                logoUrl !== undefined &&
                typeof logoUrl !== "string"
            ) {
                throw this.validationError(
                    "Logo URL không hợp lệ."
                );
            }

            if (
                supportEmail !== undefined &&
                typeof supportEmail !== "string"
            ) {
                throw this.validationError(
                    "Email hỗ trợ không hợp lệ."
                );
            }

            if (
                theme !== undefined &&
                !["light", "dark", "system"].includes(theme)
            ) {
                throw this.validationError(
                    "Giao diện không hợp lệ."
                );
            }

            if (
                primaryColor !== undefined &&
                (
                    typeof primaryColor !== "string" ||
                    !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)
                )
            ) {
                throw this.validationError(
                    "Mã màu không hợp lệ."
                );
            }

            if (
                defaultPageSize !== undefined &&
                (
                    !Number.isInteger(defaultPageSize) ||
                    defaultPageSize < 1 ||
                    defaultPageSize > 100
                )
            ) {
                throw this.validationError(
                    "Số lượng bản ghi mỗi trang phải từ 1 đến 100."
                );
            }
        }

        // PAYMENT
        if (key === "payment") {
            const {
                platformFeeRate,
                environment,
                providers,
            } = value;

            if (
                platformFeeRate !== undefined &&
                (
                    typeof platformFeeRate !== "number" ||
                    platformFeeRate < 0 ||
                    platformFeeRate > 100
                )
            ) {
                throw this.validationError(
                    "Tỷ lệ phí sàn phải nằm trong khoảng 0–100."
                );
            }

            if (
                environment !== undefined &&
                !["SANDBOX", "PRODUCTION"].includes(environment)
            ) {
                throw this.validationError(
                    "Môi trường thanh toán không hợp lệ."
                );
            }

            if (
                providers !== undefined &&
                (
                    !providers ||
                    typeof providers !== "object" ||
                    Array.isArray(providers)
                )
            ) {
                throw this.validationError(
                    "Danh sách cổng thanh toán không hợp lệ."
                );
            }

            for (const provider of Object.values(providers || {})) {
                if (
                    !provider ||
                    typeof provider.enabled !== "boolean"
                ) {
                    throw this.validationError(
                        "Trạng thái cổng thanh toán phải là true hoặc false."
                    );
                }
            }

            if (
                value.wallet !== undefined &&
                (
                    !value.wallet ||
                    typeof value.wallet !== "object" ||
                    Array.isArray(value.wallet)
                )
            ) {
                throw this.validationError(
                    "Cấu hình ví điện tử không hợp lệ."
                );
            }

            if (value.wallet?.minTopUp !== undefined &&
                (typeof value.wallet.minTopUp !== "number" || value.wallet.minTopUp < 0)) {
                throw this.validationError(
                    "Số tiền nạp tối thiểu không hợp lệ."
                );
            }

            if (value.wallet?.maxTopUp !== undefined &&
                (typeof value.wallet.maxTopUp !== "number" || value.wallet.maxTopUp <= 0)) {
                throw this.validationError(
                    "Số tiền nạp tối đa không hợp lệ."
                );
            }

            if (value.wallet?.minTopUp !== undefined &&
                value.wallet?.maxTopUp !== undefined &&
                value.wallet.minTopUp > value.wallet.maxTopUp) {
                throw this.validationError(
                    "Số tiền nạp tối thiểu không được lớn hơn số tiền nạp tối đa."
                );
            }

            for (const flag of ["enabled", "allowWalletPayment", "allowWithdraw"]) {
                if (
                    value.wallet?.[flag] !== undefined &&
                    typeof value.wallet[flag] !== "boolean"
                ) {
                    throw this.validationError(
                        "Cấu hình ví điện tử không hợp lệ."
                    );
                }
            }

            if (value.wallet?.minWithdraw !== undefined &&
                (typeof value.wallet.minWithdraw !== "number" || value.wallet.minWithdraw < 0)) {
                throw this.validationError(
                    "Số tiền rút tối thiểu không hợp lệ."
                );
            }

            if (value.wallet?.maxWithdraw !== undefined &&
                (typeof value.wallet.maxWithdraw !== "number" || value.wallet.maxWithdraw <= 0)) {
                throw this.validationError(
                    "Số tiền rút tối đa không hợp lệ."
                );
            }

            if (value.wallet?.minWithdraw !== undefined &&
                value.wallet?.maxWithdraw !== undefined &&
                value.wallet.minWithdraw > value.wallet.maxWithdraw) {
                throw this.validationError(
                    "Số tiền rút tối thiểu không được lớn hơn số tiền rút tối đa."
                );
            }

            if (value.wallet?.allowedRoles !== undefined) {
                const roles = value.wallet.allowedRoles;
                const validRoles = ["USER", "ORGANIZER", "ADMIN"];

                if (
                    !Array.isArray(roles) ||
                    roles.some((role) => !validRoles.includes(role))
                ) {
                    throw this.validationError(
                        "Danh sách vai trò được phép dùng ví điện tử không hợp lệ."
                    );
                }
            }
        }

        // LOCALIZATION
        if (key === "localization") {
            if (
                value.defaultLanguage !== undefined &&
                typeof value.defaultLanguage !== "string"
            ) {
                throw this.validationError(
                    "Ngôn ngữ mặc định không hợp lệ."
                );
            }

            if (
                value.supportedLanguages !== undefined &&
                (
                    !Array.isArray(value.supportedLanguages) ||
                    value.supportedLanguages.length === 0 ||
                    !value.supportedLanguages.every(
                        (language) => typeof language === "string"
                    )
                )
            ) {
                throw this.validationError(
                    "Danh sách ngôn ngữ không hợp lệ."
                );
            }
        }

        // APPEARANCE
        if (key === "appearance") {
            if (
                value.theme !== undefined &&
                !["light", "dark", "system"].includes(value.theme)
            ) {
                throw this.validationError(
                    "Giao diện không hợp lệ."
                );
            }

            if (
                value.primaryColor !== undefined &&
                (
                    typeof value.primaryColor !== "string" ||
                    !/^#[0-9A-Fa-f]{6}$/.test(value.primaryColor)
                )
            ) {
                throw this.validationError(
                    "Mã màu không hợp lệ."
                );
            }

            if (
                value.logoUrl !== undefined &&
                typeof value.logoUrl !== "string"
            ) {
                throw this.validationError(
                    "Logo URL không hợp lệ."
                );
            }
        }

        // SECURITY
        if (key === "security") {
            const {
                password,
                loginProtection,
                session,
            } = value;

            if (password !== undefined) {
                if (
                    !password ||
                    typeof password !== "object" ||
                    Array.isArray(password)
                ) {
                    throw this.validationError(
                        "Chính sách mật khẩu không hợp lệ."
                    );
                }

                if (
                    password.minLength !== undefined &&
                    (
                        !Number.isInteger(password.minLength) ||
                        password.minLength < 8 ||
                        password.minLength > 32
                    )
                ) {
                    throw this.validationError(
                        "Độ dài mật khẩu phải từ 8 đến 32 ký tự."
                    );
                }

                for (const field of [
                    "requireUppercase",
                    "requireNumber",
                    "requireSpecialChar",
                ]) {
                    if (
                        password[field] !== undefined &&
                        typeof password[field] !== "boolean"
                    ) {
                        throw this.validationError(
                            "Chính sách mật khẩu phải có giá trị true hoặc false."
                        );
                    }
                }
            }

            if (loginProtection !== undefined) {
                if (
                    !loginProtection ||
                    typeof loginProtection !== "object" ||
                    Array.isArray(loginProtection)
                ) {
                    throw this.validationError(
                        "Cấu hình bảo vệ đăng nhập không hợp lệ."
                    );
                }

                if (
                    loginProtection.maxFailedAttempts !== undefined &&
                    (
                        !Number.isInteger(loginProtection.maxFailedAttempts) ||
                        loginProtection.maxFailedAttempts < 1 ||
                        loginProtection.maxFailedAttempts > 20
                    )
                ) {
                    throw this.validationError(
                        "Số lần đăng nhập sai phải từ 1 đến 20."
                    );
                }

                if (
                    loginProtection.lockoutDuration !== undefined &&
                    (
                        !Number.isInteger(loginProtection.lockoutDuration) ||
                        loginProtection.lockoutDuration < 1 ||
                        loginProtection.lockoutDuration > 1440
                    )
                ) {
                    throw this.validationError(
                        "Thời gian khóa tài khoản phải từ 1 đến 1440 phút."
                    );
                }
            }

            if (session !== undefined) {
                if (
                    !session ||
                    typeof session !== "object" ||
                    Array.isArray(session)
                ) {
                    throw this.validationError(
                        "Cấu hình phiên đăng nhập không hợp lệ."
                    );
                }

                if (
                    session.sessionTimeout !== undefined &&
                    (
                        !Number.isInteger(session.sessionTimeout) ||
                        session.sessionTimeout < 5 ||
                        session.sessionTimeout > 1440
                    )
                ) {
                    throw this.validationError(
                        "Thời gian phiên đăng nhập phải từ 5 đến 1440 phút."
                    );
                }
            }
        }

        // NOTIFICATION - chi con phan CO BAN (kenh gui), khong co danh muc loai.
        if (key === "notification") {
            if (value.channels !== undefined) {
                if (
                    !value.channels ||
                    typeof value.channels !== "object" ||
                    Array.isArray(value.channels)
                ) {
                    throw this.validationError(
                        "Cấu hình thông báo không hợp lệ."
                    );
                }

                for (const enabled of Object.values(value.channels)) {
                    if (typeof enabled !== "boolean") {
                        throw this.validationError(
                            "Trạng thái thông báo phải là true hoặc false."
                        );
                    }
                }

                // Chi chap nhan cac kenh da dinh nghia.
                const validChannels = ["email", "inApp"];
                for (const channel of Object.keys(value.channels)) {
                    if (!validChannels.includes(channel)) {
                        throw this.validationError(
                            `Kênh thông báo "${channel}" không hợp lệ.`
                        );
                    }
                }
            }
        }
    }

    // Tạo lỗi validation
    validationError(message) {
        const error = new Error(message);
        error.statusCode = 400;
        return error;
    }
}

module.exports = new AdminSystemService();