
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

    payment: {
        platformFeeRate: 2,
        environment: "SANDBOX",
        providers: {
            momo: { enabled: true },
            vnpay: { enabled: true },
            payos: { enabled: false },
        },
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

    notification: {
        channels: {
            email: true,
            inApp: true,
        },
        events: {
            accountRegistration: true,
            paymentSuccess: true,
            eventUpdate: true,
            securityAlert: true,
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
                result[setting.key] = setting.value;
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

        return setting
            ? setting.value
            : DEFAULT_SETTINGS[key];
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
            mergedValue.providers = {
                ...currentValue.providers,
                ...(value.providers || {}),
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

        // Merge cấu hình thông báo
        if (key === "notification") {
            mergedValue.channels = {
                ...currentValue.channels,
                ...(value.channels || {}),
            };

            mergedValue.events = {
                ...currentValue.events,
                ...(value.events || {}),
            };
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

        // NOTIFICATION
        if (key === "notification") {
            for (const group of ["channels", "events"]) {
                if (value[group] !== undefined) {
                    if (
                        !value[group] ||
                        typeof value[group] !== "object" ||
                        Array.isArray(value[group])
                    ) {
                        throw this.validationError(
                            "Cấu hình thông báo không hợp lệ."
                        );
                    }

                    for (const enabled of Object.values(value[group])) {
                        if (typeof enabled !== "boolean") {
                            throw this.validationError(
                                "Trạng thái thông báo phải là true hoặc false."
                            );
                        }
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