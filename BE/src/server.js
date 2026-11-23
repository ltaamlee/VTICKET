const app = require('./app');
const { expireDueOrders } = require('./services/user/order.service');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 VTicket Server running on port ${PORT}`);
});

let expiringOrders = false;
async function releaseExpiredOrders() {
  if (expiringOrders) return;
  expiringOrders = true;
  try {
    await expireDueOrders();
  } catch (error) {
    console.error("Không thể giải phóng đơn hàng hết hạn:", error.code || error.name);
  } finally {
    expiringOrders = false;
  }
}

releaseExpiredOrders();
setInterval(releaseExpiredOrders, 30000).unref();
