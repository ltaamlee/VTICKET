import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AccountLayout from "../../../layout/AccountLayout";
import { getOrder, listOrders } from "../services/orderService";
import { Ticket, Calendar, ArrowRight, Sparkles, X, QrCode, CreditCard, Clock, MapPin, Receipt, UserCheck, ShieldCheck } from "lucide-react";

const STATUS_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "PAID", label: "Thành công" },
  { key: "PENDING_PAYMENT", label: "Đang xử lý" },
  { key: "CANCELLED_GROUP", label: "Đã hủy" },
];

const STATUS_CONFIG = {
  PAID: { label: "Thành công", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PENDING_PAYMENT: { label: "Chờ thanh toán", className: "bg-amber-50 text-amber-700 border-amber-200" },
  EXPIRED: { label: "Hết hạn", className: "bg-rose-50 text-rose-700 border-rose-200" },
  CANCELLED: { label: "Đã hủy", className: "bg-slate-100 text-slate-600 border-slate-200" },
  REFUNDED: { label: "Đã hoàn tiền", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function MyTicketsPage() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    if (!selectedOrderId) {
      setDetailOrder(null);
      setDetailError("");
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    getOrder(selectedOrderId)
      .then((res) => {
        if (!cancelled) setDetailOrder(res.data);
      })
      .catch((err) => {
        if (!cancelled) setDetailError(err.message || "Không thể tải chi tiết đơn hàng");
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedOrderId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listOrders(page)
      .then((response) => {
        if (!cancelled) {
          setData(response.data);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải danh sách vé");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const orders = data?.orders || [];
  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "CANCELLED_GROUP") {
      return ["CANCELLED", "EXPIRED", "REFUNDED"].includes(order.status);
    }
    return order.status === filter;
  });

  return (
    <AccountLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Ticket className="h-5 w-5 text-blue-600" />
            Vé của tôi
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý vé đã mua và lịch sử đơn hàng của bạn
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm self-start sm:self-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Đang tải danh sách vé và đơn hàng...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Ticket className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            Chưa có vé hoặc đơn hàng nào
          </h3>
          <p className="mt-1.5 text-sm text-slate-500">
            Hãy khám phá các sự kiện đang mở bán và đặt vé ngay.
          </p>
          <Link
            to="/events"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            Khám phá sự kiện
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = STATUS_CONFIG[order.status] || {
              label: order.status,
              className: "bg-slate-100 text-slate-600 border-slate-200",
            };
            const firstEvent = order.orderItems?.[0]?.ticketType?.event;
            const firstSession = order.orderItems?.[0]?.ticketType?.session;
            const eventDate = firstSession?.startAt
              ? new Date(firstSession.startAt)
              : firstEvent?.startAt
              ? new Date(firstEvent.startAt)
              : order.createdAt
              ? new Date(order.createdAt)
              : null;
            const totalTickets = order.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

            return (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300"
              >
                {/* Cuống vé bên trái (Ngày/Tháng/Năm) */}
                {eventDate && (
                  <div className="relative flex sm:w-28 shrink-0 flex-row sm:flex-col items-center justify-center gap-2 sm:gap-0.5 border-b sm:border-b-0 sm:border-r border-dashed border-slate-200 bg-slate-50 px-4 py-3 sm:py-5 text-center">
                    <span className="text-2xl sm:text-3xl font-extrabold leading-none text-slate-900">
                      {eventDate.getDate()}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Tháng {eventDate.getMonth() + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {eventDate.getFullYear()}
                    </span>
                  </div>
                )}

                {/* Thumbnail sự kiện */}
                {firstEvent?.thumbnailUrl ? (
                  <div className="sm:w-44 shrink-0 bg-slate-100">
                    <img
                      src={firstEvent.thumbnailUrl}
                      alt={firstEvent.name}
                      className="h-36 sm:h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex sm:w-44 shrink-0 items-center justify-center bg-slate-100 h-32 sm:h-auto text-slate-300">
                    <Ticket className="h-10 w-10" />
                  </div>
                )}

                {/* Thông tin chi tiết bên phải */}
                <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                        {firstEvent?.name || "Đơn hàng sự kiện"}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Vé điện tử
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 text-xs text-slate-600">
                      <p className="font-mono font-semibold text-slate-700">
                        Mã đơn: {order.orderCode}
                      </p>
                      {firstSession?.startAt && (
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(firstSession.startAt).toLocaleString("vi-VN")}
                        </p>
                      )}
                      {firstEvent?.location && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="line-clamp-1">{firstEvent.location}</span>
                        </p>
                      )}
                      <p className="text-slate-500">
                        {order.orderItems
                          ?.map((item) => `${item.ticketType.name} × ${item.quantity}`)
                          .join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-xs text-slate-500">{totalTickets} vé · </span>
                      <span className="text-base font-bold text-blue-600">
                        {Number(order.totalAmount).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    {order.status === "PENDING_PAYMENT" ? (
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                      >
                        Thanh toán ngay
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
                      >
                        Xem chi tiết
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Trang trước
          </button>
          <span className="font-medium text-slate-600">
            Trang {data.currentPage} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Trang tiếp
          </button>
        </div>
      )}

      {selectedOrderId && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-[2px]"
          onClick={() => setSelectedOrderId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Chi tiết vé</h3>
                {detailOrder?.orderCode && (
                  <p className="mt-0.5 font-mono text-xs font-semibold text-slate-500">
                    {detailOrder.orderCode}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading && (
                <div className="py-12 text-center text-sm text-slate-500">
                  Đang tải thông tin chi tiết...
                </div>
              )}

              {detailError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {detailError}
                </div>
              )}

              {!detailLoading && detailOrder && (
                <>
                  {/* Card vé phong cách Ticketbox */}
                  {detailOrder.items?.[0]?.ticketType?.event && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      {detailOrder.items[0].ticketType.event.thumbnailUrl ? (
                        <div className="relative h-56 w-full overflow-hidden bg-slate-900">
                          <img
                            src={detailOrder.items[0].ticketType.event.thumbnailUrl}
                            alt={detailOrder.items[0].ticketType.event.name}
                            className="h-full w-full object-cover opacity-90 transition duration-300 hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-slate-100 text-slate-300">
                          <Ticket className="h-12 w-12" />
                        </div>
                      )}

                      <div className="p-5 space-y-4">
                        <h4 className="text-lg font-bold text-slate-900 leading-snug">
                          {detailOrder.items[0].ticketType.event.name}
                        </h4>

                        {/* Thông tin vé & QR code bên phải */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                          <div className="space-y-1.5 text-xs text-slate-600">
                            <div>
                              <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">Loại vé</span>
                              <span className="font-bold text-slate-800 text-sm">
                                {detailOrder.items.map((i) => i.ticketType.name).join(", ")}
                              </span>
                            </div>
                            {detailOrder.items[0].ticketType.session?.startAt && (
                              <div>
                                <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">Thời gian</span>
                                <span className="font-semibold text-slate-700">
                                  {new Date(detailOrder.items[0].ticketType.session.startAt).toLocaleString("vi-VN")}
                                </span>
                              </div>
                            )}
                            {detailOrder.items[0].ticketType.event.location && (
                              <div>
                                <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">Địa điểm</span>
                                <span className="text-slate-700">{detailOrder.items[0].ticketType.event.location}</span>
                              </div>
                            )}
                          </div>

                          {/* QR Code demo/scan */}
                          {detailOrder.status === "PAID" && detailOrder.items?.[0]?.tickets?.[0] && (
                            <div className="flex flex-col items-center justify-center rounded-xl bg-white p-2.5 shadow-sm border border-slate-200 self-center sm:self-auto shrink-0">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                                  detailOrder.items[0].tickets[0].qrToken || detailOrder.items[0].tickets[0].ticketCode
                                )}`}
                                alt="QR Code"
                                className="h-24 w-24 rounded object-contain"
                              />
                              <span className="mt-1 font-mono text-[10px] font-bold text-slate-600">
                                {detailOrder.items[0].tickets[0].ticketCode}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1. Bảng Đơn hàng */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs font-bold text-slate-700">
                      <Receipt className="h-4 w-4 text-slate-500" />
                      Đơn hàng: <span className="font-mono">{detailOrder.orderCode || detailOrder.id}</span>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-slate-100 text-center text-xs">
                      <div className="p-3">
                        <p className="text-[11px] font-medium text-slate-400">Ngày tạo đơn</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {detailOrder.createdAt ? new Date(detailOrder.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </p>
                      </div>
                      <div className="p-3">
                        <p className="text-[11px] font-medium text-slate-400">Phương thức</p>
                        <p className="mt-1 font-semibold text-slate-800">SePay / Ngân hàng</p>
                      </div>
                      <div className="p-3">
                        <p className="text-[11px] font-medium text-slate-400">Tình trạng</p>
                        <span className={`mt-1 inline-block font-semibold ${(STATUS_CONFIG[detailOrder.status] || {}).className ? "text-emerald-700" : "text-slate-700"}`}>
                          {(STATUS_CONFIG[detailOrder.status] || {}).label || detailOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Bảng Thông tin người mua */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs font-bold text-slate-700">
                      <UserCheck className="h-4 w-4 text-slate-500" />
                      Thông tin người mua
                    </div>
                    <div className="divide-y divide-slate-100 p-4 text-xs space-y-2">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Tên người mua</span>
                        <span className="font-bold text-slate-800">
                          {detailOrder.buyer?.fullName || "Chưa cập nhật"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Email</span>
                        <span className="font-semibold text-slate-700">
                          {detailOrder.buyer?.email || "Chưa cập nhật"}
                        </span>
                      </div>
                      {detailOrder.buyer?.phone && (
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Số điện thoại</span>
                          <span className="font-semibold text-slate-700">
                            {detailOrder.buyer.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Bảng Thông tin đơn hàng (Hạng vé, Số lượng, Thành tiền) */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs font-bold text-slate-700">
                      <CreditCard className="h-4 w-4 text-slate-500" />
                      Chi tiết đơn hàng
                    </div>
                    <div className="p-4">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-medium">
                            <th className="pb-2">Loại vé</th>
                            <th className="pb-2 text-center">Số lượng</th>
                            <th className="pb-2 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailOrder.items?.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2.5">
                                <span className="font-bold text-slate-800 block">{item.ticketType.name}</span>
                                <span className="text-[11px] text-slate-400">
                                  {Number(item.unitPrice || (item.subtotal / item.quantity)).toLocaleString("vi-VN")} đ
                                </span>
                              </td>
                              <td className="py-2.5 text-center font-bold text-slate-700">{item.quantity}</td>
                              <td className="py-2.5 text-right font-bold text-slate-800">
                                {Number(item.subtotal).toLocaleString("vi-VN")} đ
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-200">
                            <td colSpan={2} className="pt-3 font-semibold text-slate-500">Tổng tạm tính</td>
                            <td className="pt-3 text-right font-bold text-slate-800">
                              {Number(detailOrder.totalAmount).toLocaleString("vi-VN")} đ
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={2} className="pt-2 font-bold text-slate-900 text-sm">Tổng tiền</td>
                            <td className="pt-2 text-right font-extrabold text-blue-600 text-base">
                              {Number(detailOrder.totalAmount).toLocaleString("vi-VN")} đ
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* 4. Danh sách mã vé chi tiết */}
                  {detailOrder.items?.some((i) => i.tickets?.length > 0) && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                        <QrCode className="h-4 w-4 text-blue-600" />
                        Danh sách mã vé check-in ({detailOrder.items.reduce((acc, curr) => acc + curr.tickets.length, 0)} vé)
                      </div>
                      <div className="grid gap-2">
                        {detailOrder.items.flatMap((item) =>
                          item.tickets.map((t) => (
                            <div
                              key={t.ticketCode}
                              className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-xs"
                            >
                              <div>
                                <span className="font-mono font-bold text-slate-800">{t.ticketCode}</span>
                                {t.seat && (
                                  <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">
                                    Ghế: {t.seat.rowLabel}{t.seat.seatNumber}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {t.status === "CHECKED_IN" ? "Đã check-in" : "Chưa sử dụng"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}
