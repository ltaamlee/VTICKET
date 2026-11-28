/**
 * Kiem tra chính xac:
 *  1. Tat MOT EVENT cu the -> bi chan (khong tao thong bao).
 *  2. Cache config bi xoa khi admin luu qua API -> ap dung ngay.
 */

const prisma = require("./src/config/prisma");
const notificationService = require("./src/services/notification/notification.service");

const USER_ID = String(process.env.TEST_USER_ID || "").trim();

const BASE_EVENTS = {
    accountRegistration: true,
    securityAlert: true,
    eventUpdate: true,
    paymentSuccess: true,
    ticketIssued: true,
    checkIn: true,
    resale: true,
    wallet: true,
    organizerRequest: true,
};

async function setConfig(channels, events) {
    await prisma.systemSetting.upsert({
        where: { key: "notification" },
        update: { value: { channels, events } },
        create: { key: "notification", value: { channels, events } },
    });
    notificationService.invalidateConfigCache();
}

async function countFor(type) {
    return prisma.notification.count({ where: { userId: USER_ID, type } });
}

async function main() {
    if (!USER_ID) {
        console.error("Thieu TEST_USER_ID");
        process.exit(1);
    }

    let passed = 0;
    let failed = 0;

    // ---- Test A: tat rieng event "wallet" ----
    await setConfig({ email: true, inApp: true }, { ...BASE_EVENTS, wallet: false });

    const beforeA = await countFor("WALLET_TOPUP");
    const resA = await notificationService.notify({
        type: "WALLET_TOPUP",
        userId: USER_ID,
        title: "CHK-A wallet event tat",
        body: "x",
    });
    const afterA = await countFor("WALLET_TOPUP");

    if (!resA.sent && afterA === beforeA && resA.reason === "EVENT_DISABLED") {
        console.log(`PASS A: event=wallet TAT -> chan (reason=${resA.reason})`);
        passed++;
    } else {
        console.log(`FAIL A: sent=${resA.sent} reason=${resA.reason} ${beforeA}->${afterA}`);
        failed++;
    }

    // ---- Test B: event khac van duoc gui ----
    const beforeB = await countFor("PAYMENT_SUCCESS");
    const resB = await notificationService.notify({
        type: "PAYMENT_SUCCESS",
        userId: USER_ID,
        title: "CHK-B payment van gui",
        body: "x",
    });
    const afterB = await countFor("PAYMENT_SUCCESS");

    if (resB.sent && afterB === beforeB + 1) {
        console.log("PASS B: event khac van gui binh thuong");
        passed++;
    } else {
        console.log(`FAIL B: sent=${resB.sent} ${beforeB}->${afterB}`);
        failed++;
    }

    // ---- Test C: bat lai event wallet -> gui lai ----
    await setConfig({ email: true, inApp: true }, BASE_EVENTS);
    const beforeC = await countFor("WALLET_TOPUP");
    const resC = await notificationService.notify({
        type: "WALLET_TOPUP",
        userId: USER_ID,
        title: "CHK-C wallet bat lai",
        body: "x",
    });
    const afterC = await countFor("WALLET_TOPUP");

    if (resC.sent && afterC === beforeC + 1) {
        console.log("PASS C: bat lai event wallet -> gui lai thanh cong");
        passed++;
    } else {
        console.log(`FAIL C: sent=${resC.sent} ${beforeC}->${afterC}`);
        failed++;
    }

    // ---- Test D: tat ca kenh (inApp=false, email=false) -> chan ----
    await setConfig({ email: false, inApp: false }, BASE_EVENTS);
    const beforeD = await countFor("PAYMENT_SUCCESS");
    const resD = await notificationService.notify({
        type: "PAYMENT_SUCCESS",
        userId: USER_ID,
        title: "CHK-D tat ca kenh",
        body: "x",
    });
    const afterD = await countFor("PAYMENT_SUCCESS");

    if (!resD.sent && afterD === beforeD) {
        console.log(`PASS D: tat ca kenh -> chan (reason=${resD.reason})`);
        passed++;
    } else {
        console.log(`FAIL D: sent=${resD.sent} ${beforeD}->${afterD}`);
        failed++;
    }

    // ---- Test E: doc config hien tai tu DB ----
    await setConfig({ email: true, inApp: true }, BASE_EVENTS);
    const cfg = await notificationService.getNotificationConfig();
    if (cfg.channels.inApp === true && cfg.events.wallet === true) {
        console.log("PASS E: doc config tu DB dung");
        passed++;
    } else {
        console.log("FAIL E: config sai", JSON.stringify(cfg));
        failed++;
    }

    // don sach
    await prisma.notification.deleteMany({
        where: { userId: USER_ID, title: { startsWith: "CHK-" } },
    });

    console.log(`\n=== KET QUA: ${passed} pass, ${failed} fail ===`);
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
