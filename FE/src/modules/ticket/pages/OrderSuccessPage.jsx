import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Header from "../../../layout/Header";
import Footer from "../../../layout/Footer";
import { getOrder } from "../services/orderService";

export default function OrderSuccessPage() {
    const { id } = useParams();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getOrder(id).then((response) => {
            if (!cancelled) setOrder(response.data);
        }).catch((err) => {
            if (!cancelled) setError(err.message || "Không thể tải đơn hàng");
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [id]);

    const totalTickets = order?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Header />
            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
                {loading && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                        Đang kiểm tra đơn hàng...
                    </div>
                )}
                {error && (
                    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {error}
                    </div>
                )}
                {location.state?.storageError && (
                    <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                        {location.state.storageError}
                    </div>
                )}
                {order && order.status !== "PAID" && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <h1 className="text-xl font-bold text-slate-900">Đơn hàng chưa được xác nhận thanh toán</h1>
                        <Link
                            className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                            to={`/orders/${encodeURIComponent(id)}`}
                        >
                            Xem trạng thái đơn hàng
                        </Link>
                    </div>
                )}
                {order?.status === "PAID" && (
                    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
                        <div className="bg-emerald-50/80 px-6 py-6 border-b border-emerald-100">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white text-xl font-bold">
                                        ✓
                                    </span>
                                    <div>
                                        <h1 className="text-2xl font-bold text-emerald-900">Đặt vé thành công</h1>
                                        {order.paidAt && (
                                            <p className="mt-0.5 text-xs text-emerald-700">
                                                Thanh toán lúc: {new Date(order.paidAt).toLocaleString("vi-VN")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <span className="rounded-full border border-emerald-200 bg-white px-3.5 py-1 font-mono text-sm font-bold text-emerald-800">
                                    {order.orderCode}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid gap-3 sm:grid-cols-3 text-sm">
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-xs font-medium text-slate-500">Mã đơn hàng</p>
                                    <p className="mt-1 font-mono font-bold text-slate-900">{order.orderCode}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-xs font-medium text-slate-500">Số lượng vé</p>
                                    <p className="mt-1 font-bold text-slate-900">{totalTickets} vé</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-xs font-medium text-slate-500">Tổng thanh toán</p>
                                    <p className="mt-1 font-bold text-emerald-700">{Number(order.totalAmount).toLocaleString("vi-VN")} đ</p>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100 border-t border-slate-100">
                                {order.items.map((item) => (
                                    <div key={item.id} className="py-4">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-slate-900">{item.ticketType.event.name}</p>
                                                <p className="mt-1 text-sm font-medium text-slate-700">
                                                    {item.ticketType.name} × {item.quantity}
                                                </p>
                                                {item.ticketType.session && (
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Suất diễn: {new Date(item.ticketType.session.startAt).toLocaleString("vi-VN")}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="font-bold text-slate-900">
                                                {Number(item.subtotal).toLocaleString("vi-VN")} đ
                                            </p>
                                        </div>
                                        {item.tickets?.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {item.tickets.map((ticket) => (
                                                    <span
                                                        key={ticket.ticketCode}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                                                    >
                                                        <span className="font-mono font-semibold text-slate-900">{ticket.ticketCode}</span>
                                                        {ticket.seat && (
                                                            <span className="text-slate-500">
                                                                · Ghế {ticket.seat.rowLabel}{ticket.seat.seatNumber}
                                                            </span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                                <Link
                                    to="/my-tickets"
                                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                                >
                                    Xem vé của tôi
                                </Link>
                                <Link
                                    to={`/orders/${encodeURIComponent(id)}`}
                                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Chi tiết đơn hàng
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
