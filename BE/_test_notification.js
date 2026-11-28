/**
 * Kiểm thử end-to-end hệ thống thông báo realtime.
 *
 * Mục tiêu:
 *   1. Không còn danh mục loại thông báo cố định -> mọi type đều gửi được.
 *   2. Chỉ kênh trong System Setting quyết định có gửi hay không.
 *   3. Thông báo tới Admin (yêu cầu BTC) được tạo + đẩy realtime ngay.
 *
 *   - Bật kênh inApp -> thông báo được tạo trong DB.
 *   - Tắt kênh inApp -> thông báo KHÔNG được tạo.
 *   - Bật lại -> hoạt động bình thường.
 */

const prisma = require("./src/config/prisma");
const notificationService = require("./src/services/notification/notification.service");

const userId = String(process.env.TEST_USER_ID || "").trim();

function log(icon, message) {
    console.log(`${icon} ${message}`);
}

async function setConfig(channels, events) {
    await prisma.systemSetting.upsert({
        where: { key: "notification" },
        update: { value: { channels, events } },
        create: { key: "notification", value: { channels, events } },
    });
    notificationService.invalidateConfigCache();
}

async function countFor(userId, type) {
    return prisma.notification.count({ where: { userId, type } });
}

async function main() {
    if (!userId) {
        console.error("Thiếu TEST_USER_ID");
        process.exit(1);
    }

    let passed = 0;
    let failed = 0;

    // ---------- Test 1: inApp bật -> có thông báo ----------
    await setConfig({ email: true, inApp: true });
    const before1 = await countFor(userId, "WALLET_TOPUP");
    const res1 = await notificationService.notify({
        type: "WALLET_TOPUP",
        userId: userId,
        title: "Test: nạp tiền",
        body: "Test realtime notification",
        link: "/wallet",
    });
    const after1 = await countFor(userId, "WALLET_TOPUP");

    if (res1.sent && after1 === before1 + 1) {
        log("PASS", `inApp=BAT -> tao thong bao (${before1} -> ${after1})`);
        passed++;
    } else {
        log("FAIL", `inApp=BAT -> expected +1, got ${res1.sent}, ${before1} -> ${after1}`);
        failed++;
    }

    // ---------- Test 2: inApp tat -> KHONG tao thong bao ----------
    await setConfig({ email: true, inApp: false });
    const before2 = await countFor(userId, "WALLET_TOPUP");
    const res2 = await notificationService.notify({
        type: "WALLET_TOPUP",
        userId: userId,
        title: "Test: nạp tiền (nên bị chặn)",
        body: "Test realtime notification",
    });
    const after2 = await countFor(userId, "WALLET_TOPUP");

    if (!res2.sent && after2 === before2) {
        log("PASS", `inApp=TAT -> khong tao thong bao (reason: ${res2.reason})`);
        passed++;
    } else {
        log("FAIL", `inApp=TAT -> expected blocked, got sent=${res2.sent}, ${before2} -> ${after2}`);
        failed++;
    }

    // ---------- Test 3: bat lai -> hoat dong ----------
    await setConfig({ email: true, inApp: true });
    const before3 = await countFor(userId, "WALLET_TOPUP");
    const res3 = await notificationService.notify({
        type: "WALLET_TOPUP",
        userId: userId,
        title: "Test: nạp tiền (bật lại)",
        body: "Test realtime notification",
    });
    const after3 = await countFor(userId, "WALLET_TOPUP");

    if (res3.sent && after3 === before3 + 1) {
        log("PASS", `bat lai -> tao thong bao binh thuong (${before3} -> ${after3})`);
        passed++;
    } else {
        log("FAIL", `bat lai -> expected +1, got ${after3 - before3}`);
        failed++;
    }

    // ---------- Test 4: type la chuoi tu do (khong co danh muc co dinh) ----------
    const customType = `CUSTOM_TEST_${Date.now()}`;
    const customRes = await notificationService.notify({
        type: customType,
        userId: userId,
        title: "Test: type tu do",
        body: "Loai thong bao moi, khong can cau hinh",
    });
    const customCount = await countFor(userId, customType);

    if (customRes.sent && customCount === 1) {
        log("PASS", `type tu do -> duoc gui ngay (${customType})`);
        passed++;
    } else {
        log("FAIL", `type tu do -> sent=${customRes.sent}, count=${customCount}`);
        failed++;
    }

    // ---------- Test 5: thong bao toi ADMIN (yeu cau BTC) ----------
    const admins = await prisma.user.findMany({
        where: { status: "ACTIVE", role: { roleName: "ADMIN" } },
        select: { id: true },
    });

    if (admins.length === 0) {
        log("INFO", "Khong co admin nao trong DB, bo qua test thong bao ADMIN");
    } else {
        const adminRes = await notificationService.notify({
            type: "ORGANIZER_REQUEST_SUBMITTED",
            target: "ADMIN",
            title: "Test: có yêu cầu đăng ký BTC mới",
            body: "Yêu cầu đăng ký đang chờ bạn phê duyệt.",
            link: "/admin/organizer-requests",
            metadata: { organizationName: "Test Org" },
        });

        const adminNotified = await prisma.notification.count({
            where: {
                userId: { in: admins.map((a) => a.id) },
                type: "ORGANIZER_REQUEST_SUBMITTED",
                title: "Test: có yêu cầu đăng ký BTC mới",
            },
        });

        if (adminRes.sent && adminNotified === admins.length) {
            log("PASS", `thong bao ADMIN -> gui cho ${adminNotified} admin ngay lap tuc`);
            passed++;
        } else {
            log("FAIL", `thong bao ADMIN -> sent=${adminRes.sent}, count=${adminNotified}/${admins.length}`);
            failed++;
        }
    }

    // ---------- Test 6: doc / danh dau da doc ----------
    const list = await notificationService.list(userId, { page: 1, pageSize: 5 });
    if (list.items.length > 0 && list.unreadCount >= 0) {
        log("PASS", `doc danh sach: ${list.items.length} items, ${list.unreadCount} chua doc`);
        passed++;
    } else {
        log("FAIL", "doc danh sach that bai");
        failed++;
    }

    const firstUnread = list.items.find((i) => i.status === "UNREAD");
    if (firstUnread) {
        const updated = await notificationService.markAsRead(userId, firstUnread.id);
        const unreadAfter = await notificationService.countUnread(userId);
        if (updated === 1) {
            log("PASS", `danh dau da doc -> unread con ${unreadAfter}`);
            passed++;
        } else {
            log("FAIL", `danh dau da doc -> updated=${updated}`);
            failed++;
        }
    }

    // ---------- Test 7: xoa thong bao test ----------
    const deleted = await prisma.notification.deleteMany({
        where: {
            OR: [
                { userId: userId, title: { startsWith: "Test:" } },
                { userId: { in: admins.map((a) => a.id) }, title: { startsWith: "Test:" } },
            ],
        },
    });
    log("INFO", `da don ${deleted.count} thong bao test`);

    console.log(`\n=== KET QUA: ${passed} pass, ${failed} fail ===`);
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (error) => {
    console.error("LOI:", error);
    await prisma.$disconnect();
    process.exit(1);
});
