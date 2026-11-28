/**
 * Notification Service
 *
 * Trung tâm của hệ thống thông báo realtime.
 *
 * Nguyên tắc:
 *  1. Mọi thông báo đều đi qua service này.
 *  2. KHÔNG có danh mục loại thông báo cố định trong cấu hình hệ thống.
 *     Loại thông báo (`type`) là chuỗi tự do, có thể thêm mới bất cứ lúc nào
 *     mà không cần migration DB hay cập nhật cấu hình admin.
 *  3. System Setting chỉ còn phần cơ bản: bật/tắt KÊNH gửi (email / in-app).
 *     Nếu kênh in-app tắt thì không có thông báo realtime nào được tạo.
 *  4. Thông báo được lưu vào DB để người dùng đọc lại được (offline),
 *     đồng thời được đẩy realtime qua Socket.IO ngay lập tức nếu họ đang online.
 */

const prisma = require("../../config/prisma");

const NOTIFICATION_SETTING_KEY = "notification";

// ==================== DANH MỤC LOẠI THÔNG BÁO (tham khảo) ====================

/**
 * Danh mục các loại thông báo đang được dùng trong hệ thống.
 *
 * LƯU Ý: danh mục này KHÔNG dùng để bật/tắt thông báo và KHÔNG chặn
 * thông báo nào. Mục đích chỉ là để code gọi thông báo có tên dễ đọc
 * và để FE ánh xạ icon/màu. Thêm loại mới chỉ cần thêm ở đây (hoặc bỏ qua).
 */
const NOTIFICATION_CATALOG = {
    // ----- Tài khoản -----
    ACCOUNT_REGISTRATION: { target: "USER" },
    SECURITY_ALERT: { target: "USER" },

    // ----- Sự kiện -----
    EVENT_UPDATE: { target: "ALL" },
    EVENT_APPROVED: { target: "ORGANIZER" },
    EVENT_REJECTED: { target: "ORGANIZER" },

    // ----- Thanh toán -----
    PAYMENT_SUCCESS: { target: "USER" },
    PAYMENT_FAILED: { target: "USER" },
    REFUND: { target: "USER" },

    // ----- Vé -----
    TICKET_ISSUED: { target: "USER" },
    CHECK_IN: { target: "USER" },

    // ----- Bán lại -----
    RESALE_CREATED: { target: "USER" },
    RESALE_SOLD: { target: "USER" },
    RESALE_PAYMENT_SUCCESS: { target: "USER" },
    RESALE_CANCELLED: { target: "USER" },

    // ----- Ví điện tử -----
    WALLET_TOPUP: { target: "USER" },
    WALLET_WITHDRAW: { target: "USER" },
    WALLET_PAYMENT: { target: "USER" },

    // ----- Ban tổ chức -----
    ORGANIZER_REQUEST_SUBMITTED: { target: "ADMIN" },
    ORGANIZER_REQUEST_APPROVED: { target: "USER" },
    ORGANIZER_REQUEST_REJECTED: { target: "USER" },
};

/**
 * Cấu hình mặc định khi chưa có bản ghi trong DB.
 * Chỉ gồm phần CƠ BẢN: các kênh gửi thông báo.
 * Phải khớp với DEFAULT_SETTINGS.notification của adminSystem.service.
 */
const DEFAULT_NOTIFICATION_CONFIG = {
    channels: {
        email: true,
        inApp: true,
    },
};

// Cache cấu hình để không query DB mỗi lần gửi thông báo.
let configCache = null;
let configCacheAt = 0;
const CONFIG_TTL_MS = 30_000;

/**
 * Đọc cấu hình thông báo hiện tại (có cache ngắn).
 */
async function getNotificationConfig() {
    const now = Date.now();

    if (configCache && now - configCacheAt < CONFIG_TTL_MS) {
        return configCache;
    }

    let config = DEFAULT_NOTIFICATION_CONFIG;

    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: NOTIFICATION_SETTING_KEY },
        });

        if (setting?.value) {
            config = {
                channels: {
                    ...DEFAULT_NOTIFICATION_CONFIG.channels,
                    ...(setting.value.channels || {}),
                },
            };
        }
    } catch (error) {
        console.error(
            "[Notification] Không đọc được cấu hình, dùng mặc định:",
            error.code || error.name || error.message
        );
    }

    configCache = config;
    configCacheAt = now;

    return config;
}

/**
 * Xóa cache cấu hình - gọi khi admin vừa cập nhật setting.
 */
function invalidateConfigCache() {
    configCache = null;
    configCacheAt = 0;
}

/**
 * Xác định kênh gửi cho một thông báo.
 *
 * Không còn khái niệm "bật/tắt theo loại sự kiện": chỉ có kênh.
 * - inApp bật  -> tạo bản ghi DB + đẩy realtime.
 * - inApp tắt  -> không tạo thông báo trong hệ thống (vẫn có thể gửi email).
 *
 * @returns {Promise<{inApp: boolean, email: boolean}>}
 */
async function resolveChannels() {
    const config = await getNotificationConfig();

    const inApp = config.channels?.inApp !== false;
    const email = config.channels?.email !== false;

    return { inApp, email };
}

/**
 * Lấy danh sách user nhận thông báo theo "target".
 */
async function resolveRecipients({ userId, target }) {
    // Người nhận cụ thể (bắt buộc có userId)
    if (userId) {
        return [userId];
    }

    const roleMap = {
        USER: "USER",
        ORGANIZER: "ORGANIZER",
        ADMIN: "ADMIN",
    };

    if (target === "ALL" || !roleMap[target]) {
        const users = await prisma.user.findMany({
            where: { status: "ACTIVE" },
            select: { id: true },
        });
        return users.map((u) => u.id);
    }

    const users = await prisma.user.findMany({
        where: { status: "ACTIVE", role: { roleName: roleMap[target] } },
        select: { id: true },
    });
    return users.map((u) => u.id);
}

/**
 * Gửi email thông báo tới danh sách người nhận.
 * Lỗi email không được làm fail luồng thông báo in-app.
 */
async function sendEmailForRecipients(recipientIds, { title, body, link }) {
    try {
        const emailService = require("../../shared/email.service");

        const users = await prisma.user.findMany({
            where: { id: { in: recipientIds } },
            select: { id: true, email: true },
        });

        for (const user of users) {
            if (!user.email) continue;
            try {
                await emailService.sendNotificationEmail({
                    to: user.email,
                    title,
                    body,
                    link,
                });
            } catch (error) {
                console.error(
                    "[Notification] Gửi email thông báo lỗi:",
                    error.code || error.name || error.message
                );
            }
        }
    } catch (error) {
        console.error(
            "[Notification] Không gửi được email thông báo:",
            error.code || error.name || error.message
        );
    }
}

/**
 * Tạo + gửi thông báo.
 *
 * Thông báo KHÔNG bị chặn bởi bất kỳ danh mục loại nào: cứ có yêu cầu là gửi.
 *
 * @param {Object} params
 * @param {string} params.type - Loại thông báo (chuỗi tự do, ví dụ "ORGANIZER_REQUEST_SUBMITTED")
 * @param {string} [params.userId] - User nhận cụ thể
 * @param {string} [params.target] - Nhóm nhận: USER | ORGANIZER | ADMIN | ALL
 * @param {string} params.title - Tiêu đề
 * @param {string} params.body - Nội dung
 * @param {string} [params.link] - Link điều hướng (frontend route)
 * @param {Object} [params.metadata] - Dữ liệu bổ sung
 * @returns {Promise<{sent: boolean, reason?: string, count?: number}>}
 */
async function notify({
    type,
    userId,
    target,
    title,
    body,
    link = null,
    metadata = null,
}) {
    const channels = await resolveChannels();

    const recipientIds = await resolveRecipients({ userId, target });
    if (!recipientIds.length) {
        return { sent: false, reason: "NO_RECIPIENT", count: 0 };
    }

    // Kênh in-app tắt -> không tạo bản ghi trong hệ thống, không đẩy realtime.
    // Kênh email (nếu đang bật) vẫn được gửi.
    if (!channels.inApp) {
        if (channels.email) {
            sendEmailForRecipients(recipientIds, { title, body, link }).catch((error) => {
                console.error(
                    "[Notification] Không gửi được email thông báo:",
                    error.code || error.name || error.message
                );
            });
        }
        return { sent: false, reason: "IN_APP_DISABLED", count: 0 };
    }

    // Chỉ tạo bản ghi DB cho kênh inApp (người dùng đọc lại trong hệ thống).
    // Kênh email sẽ được gửi riêng ở bước sau.
    // Lưu ý: MongoDB giới hạn số thao tác ghi trong 1 transaction. Với nhóm
    // nhận lớn (target=ALL có thể hàng nghìn user) thì transaction sẽ bị abort
    // -> dùng createMany theo lô thay vì transaction từng bản ghi.
    const created = [];
    const createdAtStart = new Date(Date.now() - 1000);
    const BATCH_SIZE = 200;
    for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
        const batch = recipientIds.slice(i, i + BATCH_SIZE);
        const result = await prisma.notification.createMany({
            data: batch.map((id) => ({
                userId: id,
                type: type || "SYSTEM",
                channel: "IN_APP",
                title,
                body,
                link,
                ...(metadata ? { metadata } : {}),
                status: "UNREAD",
            })),
        });
        created.push({ userId: batch, count: result.count });
    }

    // Lấy lại id + createdAt để đẩy realtime (chỉ khi cần).
    const createdRows = created.length
        ? await prisma.notification.findMany({
              where: {
                  userId: { in: recipientIds },
                  type: type || "SYSTEM",
                  title,
                  body,
                  createdAt: { gte: createdAtStart },
              },
              orderBy: { createdAt: "desc" },
              take: recipientIds.length,
              select: {
                  id: true,
                  userId: true,
                  type: true,
                  title: true,
                  body: true,
                  link: true,
                  metadata: true,
                  status: true,
                  createdAt: true,
              },
          })
        : [];

    // Kênh email: gửi bản email cho từng người nhận (nếu bật).
    // Không await để không làm chậm luồng chính (gửi chạy nền, lỗi đã catch).
    if (channels.email) {
        sendEmailForRecipients(recipientIds, { title, body, link }).catch((error) => {
            console.error(
                "[Notification] Không gửi được email thông báo:",
                error.code || error.name || error.message
            );
        });
    }

    // Đẩy realtime qua Socket.IO ngay lập tức.
    const realtime = require("./notification.realtime");
    for (const row of createdRows) {
        realtime.emitToUser(row.userId, "notification:new", {
            id: row.id,
            type: row.type,
            title: row.title,
            body: row.body,
            link: row.link,
            metadata: row.metadata,
            status: row.status,
            createdAt: row.createdAt,
        });
    }

    return {
        sent: true,
        count: recipientIds.length,
        channels,
    };
}

/**
 * Đếm số thông báo chưa đọc.
 */
async function countUnread(userId) {
    const result = await prisma.notification.count({
        where: { userId, status: "UNREAD", channel: "IN_APP" },
    });
    return result;
}

/**
 * Lấy danh sách thông báo (có phân trang + lọc trạng thái đọc).
 */
async function list(userId, { page = 1, pageSize = 20, status } = {}) {
    const currentPage = Math.max(1, Math.floor(Number(page) || 1));
    const size = Math.min(50, Math.max(1, Math.floor(Number(pageSize) || 20)));
    const skip = (currentPage - 1) * size;

    const where = { userId, channel: "IN_APP" };
    if (status === "unread") where.status = "UNREAD";
    else if (status === "read") where.status = "READ";

    const [items, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: size,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
            where: { userId, status: "UNREAD", channel: "IN_APP" },
        }),
    ]);

    return {
        items,
        total,
        unreadCount,
        page: currentPage,
        pageSize: size,
        totalPages: Math.max(1, Math.ceil(total / size)),
    };
}

/**
 * Đánh dấu đã đọc (một thông báo hoặc toàn bộ).
 */
async function markAsRead(userId, notificationId = null) {
    const where = { userId, status: "UNREAD" };
    if (notificationId) where.id = notificationId;

    const result = await prisma.notification.updateMany({
        where,
        data: { status: "READ", readAt: new Date() },
    });

    return result.count;
}

/**
 * Xóa một thông báo của user.
 */
async function remove(userId, notificationId) {
    const result = await prisma.notification.deleteMany({
        where: { id: notificationId, userId },
    });
    return result.count > 0;
}

/**
 * Xóa toàn bộ thông báo đã đọc của user.
 */
async function clearRead(userId) {
    const result = await prisma.notification.deleteMany({
        where: { userId, status: "READ" },
    });
    return result.count;
}

module.exports = {
    NOTIFICATION_CATALOG,
    DEFAULT_NOTIFICATION_CONFIG,
    NOTIFICATION_SETTING_KEY,
    getNotificationConfig,
    invalidateConfigCache,
    resolveChannels,
    notify,
    countUnread,
    list,
    markAsRead,
    remove,
    clearRead,
};
