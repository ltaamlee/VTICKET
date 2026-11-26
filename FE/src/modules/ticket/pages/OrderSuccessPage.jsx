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

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Header />
            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
                {loading && <p className="text-slate-500">Đang kiểm tra đơn hàng...</p>}
                {error && <p role="alert" className="text-rose-600">{error}</p>}
                {location.state?.storageError && <p role="alert" className="text-amber-700">{location.state.storageError}</p>}
                {order && order.status !== "PAID" && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <h1 className="text-xl font-bold">Đơn hàng chưa được xác nhận thanh toán</h1>
                        <Link className="mt-4 inline-block text-blue-600 underline" to={`/orders/${encodeURIComponent(id)}`}>
                            Xem trạng thái đơn hàng
                        </Link>
                    </div>
                )}
                {order?.status === "PAID" && (
                    <div className="space-y-5 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                        <h1 className="text-2xl font-bold text-emerald-700">Đặt vé thành công</h1>
                        <p className="text-slate-600">Đơn hàng đã được xác nhận. Cảm ơn bạn đã mua vé tại VTicket.</p>
                        <p className="font-semibold">Mã đơn: {order.orderCode}</p>
                        {order.items.map((item) => (
                            <div key={item.id} className="border-t border-slate-100 pt-4">
                                <p className="font-semibold">{item.ticketType.event.name}</p>
                                <p className="text-sm text-slate-600">{item.ticketType.name} · {item.quantity} vé</p>
                                {item.ticketType.session && <p className="text-sm text-slate-600">Suất: {new Date(item.ticketType.session.startAt).toLocaleString("vi-VN")}</p>}
                                {item.tickets.map((ticket) => (
                                    <p key={ticket.ticketCode} className="mt-2 text-sm text-slate-700">
                                        {ticket.ticketCode}{ticket.seat ? ` · Ghế ${ticket.seat.rowLabel}${ticket.seat.seatNumber}` : ""}
                                    </p>
                                ))}
                            </div>
                        ))}
                        <p className="border-t border-slate-100 pt-4 font-bold">Tổng cộng: {Number(order.totalAmount).toLocaleString("vi-VN")} đ</p>
                        <div className="flex flex-wrap gap-4 text-sm font-semibold text-blue-600">
                            <Link to={`/orders/${encodeURIComponent(id)}`}>Chi tiết đơn hàng</Link>
                            <Link to="/my-orders">Đơn hàng của tôi</Link>
                            <Link to="/events">Khám phá sự kiện</Link>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
