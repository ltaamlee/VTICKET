import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AccountLayout from "../../../layout/AccountLayout";
import { listOrders } from "../services/orderService";

const labels = {
    PENDING_PAYMENT: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    EXPIRED: "Hết hạn",
    CANCELLED: "Đã hủy",
    REFUNDED: "Đã hoàn tiền",
};

export default function MyOrdersPage() {
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        listOrders(page).then((response) => {
            if (!cancelled) {
                setData(response.data);
                setError("");
            }
        }).catch((err) => {
            if (!cancelled) setError(err.message || "Không thể tải đơn hàng");
        });
        return () => { cancelled = true; };
    }, [page]);

    return (
        <AccountLayout>
            <h2 className="text-xl font-bold text-slate-900">Đơn hàng của tôi</h2>
            {error && <p role="alert" className="mt-4 text-sm text-rose-600">{error}</p>}
            {!data && !error && <p className="mt-4 text-slate-500">Đang tải đơn hàng...</p>}
            {data && data.orders.length === 0 && <p className="mt-4 text-slate-500">Bạn chưa có đơn hàng.</p>}
            <div className="mt-4 space-y-3">
                {data?.orders.map((order) => (
                    <Link key={order.id} to={`/orders/${order.id}`} className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-400">
                        <div className="flex flex-wrap justify-between gap-2">
                            <span className="font-bold">{order.orderCode}</span>
                            <span className="text-sm font-semibold text-blue-700">{labels[order.status] || order.status}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{order.orderItems.map((item) => `${item.ticketType.event.name} · ${item.ticketType.name} (${item.quantity})`).join(", ")}</p>
                        <p className="mt-2 font-semibold">{Number(order.totalAmount).toLocaleString("vi-VN")} đ</p>
                    </Link>
                ))}
            </div>
            {data && data.totalPages > 1 && (
                <div className="mt-5 flex items-center gap-4 text-sm">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="text-blue-600 disabled:text-slate-300">Trang trước</button>
                    <span>Trang {data.currentPage} / {data.totalPages}</span>
                    <button type="button" disabled={page >= data.totalPages} onClick={() => setPage((value) => value + 1)} className="text-blue-600 disabled:text-slate-300">Trang tiếp</button>
                </div>
            )}
        </AccountLayout>
    );
}
