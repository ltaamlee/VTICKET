const app = require('./app');
const { expireDueOrders } = require('./services/user/order.service');
const { expireDueResaleOrders } = require('./services/resale/resaleOrder.cancel');
const ensurePaymentIndexes = require('./services/payment/paymentIndexes');
const { syncCompletedEvents } = require('./shared/eventStatus');
const notificationRealtime = require('./services/notification/notification.realtime');
const PORT = process.env.PORT || 5000;

ensurePaymentIndexes().catch((error) => {
  console.error("Không thể khởi tạo payment indexes:", error.code || error.name || error.message);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 VTicket Server running on port ${PORT}`);
});

// Khởi tạo Socket.IO realtime notification trên cùng HTTP server
notificationRealtime.attach(server);
console.log('🔔 VTicket Realtime Notification (Socket.IO) đã sẵn sàng');

let expiringOrders = false;
async function releaseExpiredOrders() {
  if (expiringOrders) return;
  expiringOrders = true;
  try {
    await expireDueOrders();
    await expireDueResaleOrders();
    await syncCompletedEvents();
  } catch (error) {
    console.error("Không thể giải phóng đơn hàng hết hạn:", error.code || error.name);
  } finally {
    expiringOrders = false;
  }
}

releaseExpiredOrders();
setInterval(releaseExpiredOrders, 30000).unref();

let emailWorker = null;
if (process.env.RUN_EMAIL_WORKER !== 'false') {
  if (!process.env.REDIS_URL) {
    console.warn('[TicketEmail] Chưa cấu hình REDIS_URL; bỏ qua tự chạy worker email.');
  } else {
    import('./jobs/ticketEmail.worker.mjs')
      .then(({ startTicketEmailWorker }) => startTicketEmailWorker({ disconnectPrisma: false }))
      .then((handle) => {
        emailWorker = handle;
        console.log('[TicketEmail] Worker gửi email vé đã khởi động cùng BE');
      })
      .catch((error) => {
        console.error('[TicketEmail] Không thể khởi động worker email:', error.message || error);
      });
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    try {
      if (emailWorker) await emailWorker.shutdown();
    } catch (error) {
      console.error('[TicketEmail] Lỗi khi dừng worker:', error.code || error.name);
    }
    try {
      await notificationRealtime.close();
    } catch (error) {
      console.error('[Notification] Lỗi khi đóng Socket.IO:', error.code || error.name);
    }
    server.close(() => process.exit(0));
  });
}
