const prisma = require("../../config/prisma");

const DEFAULT_SETTINGS = {
    general: {
        platformFeeRate: 2,
        defaultPageSize: 10,
    },
    payment: {
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
};

class AdminSystemService {
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

        return prisma.systemSetting.upsert({
            where: { key },
            update: {
                value,
            },
            create: {
                key,
                value,
            },
        });
    }

    validateSetting(key, value) {
        if (key === "general") {
            const { platformFeeRate, defaultPageSize } = value;

            if (
                platformFeeRate !== undefined &&
                (typeof platformFeeRate !== "number" ||
                    platformFeeRate < 0 ||
                    platformFeeRate > 100)
            ) {
                throw this.validationError(
                    "Tỷ lệ phí sàn phải nằm trong khoảng 0–100."
                );
            }

            if (
                defaultPageSize !== undefined &&
                (!Number.isInteger(defaultPageSize) ||
                    defaultPageSize < 1 ||
                    defaultPageSize > 100)
            ) {
                throw this.validationError(
                    "Số lượng bản ghi mỗi trang phải từ 1 đến 100."
                );
            }
        }

        if (key === "payment") {
            if (
                value.environment !== undefined &&
                !["SANDBOX", "PRODUCTION"].includes(value.environment)
            ) {
                throw this.validationError(
                    "Môi trường thanh toán không hợp lệ."
                );
            }

            if (
                value.providers !== undefined &&
                (!value.providers ||
                    typeof value.providers !== "object" ||
                    Array.isArray(value.providers))
            ) {
                throw this.validationError(
                    "Danh sách cổng thanh toán không hợp lệ."
                );
            }

            for (const provider of Object.values(value.providers || {})) {
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
                (!Array.isArray(value.supportedLanguages) ||
                    value.supportedLanguages.length === 0 ||
                    !value.supportedLanguages.every(
                        (language) => typeof language === "string"
                    ))
            ) {
                throw this.validationError(
                    "Danh sách ngôn ngữ không hợp lệ."
                );
            }
        }

        if (key === "appearance") {
            if (
                value.theme !== undefined &&
                !["light", "dark", "system"].includes(value.theme)
            ) {
                throw this.validationError("Giao diện không hợp lệ.");
            }

            if (
                value.primaryColor !== undefined &&
                (typeof value.primaryColor !== "string" ||
                    !/^#[0-9A-Fa-f]{6}$/.test(value.primaryColor))
            ) {
                throw this.validationError("Mã màu không hợp lệ.");
            }

            if (
                value.logoUrl !== undefined &&
                typeof value.logoUrl !== "string"
            ) {
                throw this.validationError("Logo URL không hợp lệ.");
            }
        }
    }

    validationError(message) {
        const error = new Error(message);
        error.statusCode = 400;
        return error;
    }
}

module.exports = new AdminSystemService();