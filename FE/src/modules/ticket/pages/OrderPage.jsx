import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Header from "../../../layout/Header";
import Footer from "../../../layout/Footer";
import { createCheckout, getOrder } from "../services/orderService";
import { getProfile } from "../../profile/services/profileService";
import BookingCountdown from "../components/BookingCountdown";

function money(amount) {
    return `${Number(amount).toLocaleString("vi-VN")} đ`;
}

export default function OrderPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [now, setNow] = useState(null);
    const [offset, setOffset] = useState(0);
    const [profile, setProfile] = useState(null);
    const [profileError, setProfileError] = useState("");
    const [profileAttempt, setProfileAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        getProfile().then((response) => {
            if (!cancelled) {
                setProfile(response.data);
                setProfileError("");
            }
        }).catch((err) => {
            if (!cancelled) setProfileError(err.message || "Không thể tải thông tin cá nhân");
        });
        return () => { cancelled = true; };
    }, [profileAttempt]);

    useEffect(() => {
        let cancelled = false;
        let timeout;
        async function refresh() {
            try {
                const response = await getOrder(id, { sync: searchParams.get("payment") === "success" });
                if (!cancelled) {
                    setNow(Date.now());
                    if (response.data.serverTime) setOffset(new Date(response.data.serverTime).getTime() - Date.now());
                    setOrder(response.data);
                    setError("");
                    if (response.data.status === "PAID" && (searchParams.get("payment") === "success" || response.data.id !== id)) {
                        navigate(`/orders/${encodeURIComponent(response.data.id)}/success`, { replace: true });
                        return;
                    }
                    if (response.data.status === "PENDING_PAYMENT") timeout = setTimeout(refresh, 5000);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Không thể tải đơn hàng");
                    timeout = setTimeout(refresh, 10000);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        refresh();
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            cancelled = true;
            clearTimeout(timeout);
            clearInterval(timer);
        };
    }, [id, navigate, searchParams]);

    const remaining = order?.expiresAt && now !== null ? Math.max(0, Math.ceil((new Date(order.expiresAt).getTime() - now - offset) / 1000)) : 0;
    const minutes = Math.floor(remaining / 60);
    const seconds = String(remaining % 60).padStart(2, "0");
    const reachedExpiry = now !== null && remaining === 0;

    useEffect(() => {
        if (order?.status !== "PENDING_PAYMENT" || !reachedExpiry) return;
        let cancelled = false;
        getOrder(id).then((response) => {
            if (!cancelled) setOrder(response.data);
        }).catch((err) => {
            if (!cancelled) setError(err.message || "Không thể cập nhật trạng thái đơn hàng");
        });
        return () => { cancelled = true; };
    }, [id, order?.status, reachedExpiry]);

    async function pay() {
        setPaying(true);
        setError("");
        try {
            const response = await createCheckout(id);
            const { url, fields } = response.data;
            const target = new URL(url);
            if (target.protocol !== "https:" || !["pay.sepay.vn", "pay-sandbox.sepay.vn"].includes(target.hostname)) {
                throw new Error("Địa chỉ cổng thanh toán không hợp lệ");
            }
            const form = document.createElement("form");
            form.method = "POST";
            form.action = target.href;
            for (const [name, value] of Object.entries(fields)) {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = name;
                input.value = String(value);
                form.appendChild(input);
            }
            document.body.appendChild(form);
            form.submit();
            form.remove();
        } catch (err) {
            setError(err.message || "Không thể chuyển đến SePay");
            setPaying(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            {order?.status === "PENDING_PAYMENT" && <BookingCountdown expiresAt={order.expiresAt} now={now === null ? null : now + offset} />}
            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
                <h1 className="text-2xl font-bold text-slate-900">{order && !order.orderCode ? "Thông tin giữ vé" : "Đơn hàng của bạn"}</h1>
                {loading && <p className="mt-4 text-slate-500">Đang tải đơn hàng...</p>}
                {error && <p role="alert" className="mt-4 text-sm text-rose-600">{error}</p>}
                {location.state?.storageError && <p role="alert" className="mt-4 text-sm text-amber-700">{location.state.storageError}</p>}
                {order && (
                    <div className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap justify-between gap-3">
                            <span className="font-semibold">{order.orderCode ? `Mã đơn: ${order.orderCode}` : "Lượt giữ vé"}</span>
                            <span className="font-bold text-blue-700">
                                {order.status === "PAID" ? "Đã thanh toán" : order.status === "PENDING_PAYMENT" ? "Chờ thanh toán" : order.status === "EXPIRED" ? "Đã hết hạn" : order.status === "CANCELLED" ? "Đã hủy" : order.status}
                            </span>
                        </div>
                        {order.status === "PENDING_PAYMENT" && (
                            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                                Thời gian giữ vé còn {minutes}:{seconds}. Vé chỉ được xác nhận sau khi SePay thông báo thanh toán thành công.
                            </p>
                        )}
                        {order.status === "PENDING_PAYMENT" && searchParams.has("payment") && (
                            <p className="text-sm text-slate-600">Đang chờ xác nhận từ SePay. Nếu giao dịch chưa hoàn tất, bạn có thể thử thanh toán lại.</p>
                        )}
                        {order.status === "EXPIRED" && (
                            <p className="text-sm text-rose-700">Lượt giữ vé đã hết hạn. Nếu bạn đã chuyển tiền, vui lòng liên hệ hỗ trợ để đối soát. {(order.eventId || order.items[0]?.ticketType.event.id) && <Link className="underline" to={`/events/${encodeURIComponent(order.eventId || order.items[0].ticketType.event.id)}`}>Bắt đầu mua lại</Link>}</p>
                        )}
                        {order.status === "CANCELLED" && <p className="text-sm text-rose-700">Đơn đã bị hủy và vé đã được trả lại. Nếu bạn đã chuyển tiền, vui lòng liên hệ hỗ trợ để đối soát.</p>}
                        <section className="rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-slate-900">Kiểm tra thông tin cá nhân</h2><Link to="/profile" className="text-sm font-semibold text-blue-600">Chỉnh sửa hồ sơ</Link></div>
                            {profileError ? <div className="mt-3 text-sm text-rose-600"><p role="alert">{profileError}</p><button type="button" className="mt-2 font-semibold underline" onClick={() => setProfileAttempt((current) => current + 1)}>Thử tải lại</button></div> : profile ? (
                                <dl className="mt-3 space-y-2 text-sm text-slate-600">
                                    <div><dt className="inline font-semibold">Họ và tên: </dt><dd className="inline">{profile.fullName || "Chưa cập nhật"}</dd></div>
                                    <div><dt className="inline font-semibold">Email: </dt><dd className="inline">{profile.email || "Chưa cập nhật"}</dd></div>
                                    <div><dt className="inline font-semibold">Số điện thoại: </dt><dd className="inline">{profile.phone || "Chưa cập nhật"}</dd></div>
                                </dl>
                            ) : <p className="mt-3 text-sm text-slate-500">Đang tải thông tin cá nhân...</p>}
                        </section>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="border-t border-slate-100 pt-4">
                                    <p className="font-semibold">{item.ticketType.event.name}</p>
                                    <p className="text-sm text-slate-500">{item.ticketType.name} · {item.quantity} vé · {money(item.subtotal)}</p>
                                    {item.ticketType.session && <p className="text-sm text-slate-500">Suất: {new Date(item.ticketType.session.startAt).toLocaleString("vi-VN")}</p>}
                                    {item.tickets.map((ticket) => (
                                        <p key={ticket.ticketCode} className="mt-2 text-sm text-slate-700">
                                            {ticket.ticketCode}{ticket.seat ? ` · Ghế ${ticket.seat.rowLabel}${ticket.seat.seatNumber}` : ""}
                                        </p>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-4 font-bold"><span>Tổng cộng</span><span>{money(order.totalAmount)}</span></div>
                        {order.status === "PENDING_PAYMENT" && (
                            <button type="button" onClick={pay} disabled={paying || remaining === 0 || !profile}
                                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50">
                                {paying ? "Đang chuyển đến SePay..." : "Thanh toán qua SePay"}
                            </button>
                        )}
                        <Link to="/events" className="block text-center text-sm text-blue-600">Khám phá sự kiện</Link>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
