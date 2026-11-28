import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Header from "../../../layout/Header";
import Footer from "../../../layout/Footer";
import { cancelOrder, createCheckout, getOrder } from "../services/orderService";
import { getProfile, updateProfile } from "../../profile/services/profileService";
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
    const [buyerForm, setBuyerForm] = useState({ fullName: "", phone: "", email: "" });
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const allowLeaveRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        getProfile().then((response) => {
            if (!cancelled) {
                setProfile(response.data);
                setBuyerForm({
                    fullName: response.data?.fullName || "",
                    phone: response.data?.phone || "",
                    email: response.data?.email || "",
                });
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

    useEffect(() => {
        if (order?.status !== "PENDING_PAYMENT") return;
        window.history.pushState({ orderGuard: true }, "", window.location.href);

        function handlePopState() {
            if (allowLeaveRef.current) return;
            window.history.pushState({ orderGuard: true }, "", window.location.href);
            setShowLeaveModal(true);
        }

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [order?.status]);

    async function handleConfirmCancel() {
        setCancelling(true);
        try {
            await cancelOrder(id);
        } catch {
            // Proceed to leave even if already expired/cancelled
        } finally {
            allowLeaveRef.current = true;
            setShowLeaveModal(false);
            setCancelling(false);
            const eventId = order?.eventId || order?.items?.[0]?.ticketType?.event?.id;
            navigate(eventId ? `/events/${encodeURIComponent(eventId)}` : "/events", { replace: true });
        }
    }

    async function pay() {
        setPaying(true);
        setError("");
        try {
            const nextFullName = buyerForm.fullName.trim();
            const nextPhone = buyerForm.phone.trim();
            if (
                nextFullName !== (profile?.fullName || "") ||
                nextPhone !== (profile?.phone || "")
            ) {
                const updated = await updateProfile({ fullName: nextFullName, phone: nextPhone });
                if (updated?.data) setProfile(updated.data);
            }
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

    const statusConfig = {
        PAID: { label: "Đã thanh toán", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        PENDING_PAYMENT: { label: "Chờ thanh toán", className: "bg-amber-50 text-amber-700 border-amber-200" },
        EXPIRED: { label: "Đã hết hạn", className: "bg-rose-50 text-rose-700 border-rose-200" },
        CANCELLED: { label: "Đã hủy", className: "bg-slate-100 text-slate-700 border-slate-200" },
    };
    const currentStatus = statusConfig[order?.status] || { label: order?.status || "", className: "bg-slate-100 text-slate-700 border-slate-200" };
    const totalTickets = order?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            {order?.status === "PENDING_PAYMENT" && <BookingCountdown expiresAt={order.expiresAt} now={now === null ? null : now + offset} />}
            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            {order && !order.orderCode ? "Thông tin giữ vé" : "Thanh toán đơn hàng"}
                        </h1>
                        {order?.createdAt && (
                            <p className="mt-1 text-sm text-slate-500">
                                Ngày tạo: {new Date(order.createdAt).toLocaleString("vi-VN")}
                            </p>
                        )}
                    </div>
                    {order && (
                        <span className={`inline-flex items-center rounded-full border px-3.5 py-1 text-sm font-semibold ${currentStatus.className}`}>
                            {currentStatus.label}
                        </span>
                    )}
                </div>

                {loading && (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                        Đang tải thông tin đơn hàng...
                    </div>
                )}
                {error && (
                    <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {error}
                    </div>
                )}
                {location.state?.storageError && (
                    <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                        {location.state.storageError}
                    </div>
                )}

                {order && (
                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <h2 className="text-base font-bold text-slate-900">Thông tin người mua</h2>
                                    <Link to="/profile" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                                        Chỉnh sửa hồ sơ
                                    </Link>
                                </div>
                                {profileError ? (
                                    <div className="mt-4 text-sm text-rose-600">
                                        <p role="alert">{profileError}</p>
                                        <button
                                            type="button"
                                            className="mt-2 font-semibold underline"
                                            onClick={() => setProfileAttempt((current) => current + 1)}
                                        >
                                            Thử tải lại
                                        </button>
                                    </div>
                                ) : profile ? (
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
                                        <div>
                                            <label htmlFor="buyer-fullName" className="block text-xs font-semibold text-slate-700">
                                                Họ và tên <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                id="buyer-fullName"
                                                type="text"
                                                value={buyerForm.fullName}
                                                onChange={(e) => setBuyerForm((prev) => ({ ...prev, fullName: e.target.value }))}
                                                placeholder="Nhập họ và tên"
                                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="buyer-phone" className="block text-xs font-semibold text-slate-700">
                                                Số điện thoại <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                id="buyer-phone"
                                                type="tel"
                                                value={buyerForm.phone}
                                                onChange={(e) => setBuyerForm((prev) => ({ ...prev, phone: e.target.value }))}
                                                placeholder="Nhập số điện thoại"
                                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label htmlFor="buyer-email" className="block text-xs font-semibold text-slate-700">
                                                Email nhận vé <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                id="buyer-email"
                                                type="email"
                                                value={buyerForm.email}
                                                onChange={(e) => setBuyerForm((prev) => ({ ...prev, email: e.target.value }))}
                                                placeholder="Nhập email"
                                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-4 text-sm text-slate-500">Đang tải thông tin cá nhân...</p>
                                )}
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <h2 className="text-base font-bold text-slate-900">Chi tiết vé</h2>
                                    <span className="text-sm font-medium text-slate-500">{totalTickets} vé</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="py-4 first:pt-4 last:pb-0">
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
                                                <p className="font-bold text-slate-900">{money(item.subtotal)}</p>
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
                            </section>
                        </div>

                        <aside className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4">
                                    Tóm tắt đơn hàng
                                </h2>
                                <dl className="mt-4 space-y-3 text-sm">
                                    {order.orderCode && (
                                        <div className="flex items-center justify-between gap-2">
                                            <dt className="text-slate-500">Mã đơn hàng</dt>
                                            <dd className="font-mono font-semibold text-slate-900">{order.orderCode}</dd>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between gap-2">
                                        <dt className="text-slate-500">Số lượng vé</dt>
                                        <dd className="font-semibold text-slate-900">{totalTickets} vé</dd>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                                        <dt>Tổng thanh toán</dt>
                                        <dd className="text-blue-600">{money(order.totalAmount)}</dd>
                                    </div>
                                </dl>

                                <div className="mt-6 space-y-3">
                                    {order.status === "PENDING_PAYMENT" && (
                                        <>
                                            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={agreedTerms}
                                                    onChange={(e) => setAgreedTerms(e.target.checked)}
                                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>
                                                    Tôi đồng ý với <span className="font-semibold text-slate-800">Điều khoản sử dụng</span> và <span className="font-semibold text-slate-800">Chính sách mua vé</span> của VTicket.
                                                </span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={pay}
                                                disabled={
                                                    paying ||
                                                    remaining === 0 ||
                                                    !profile ||
                                                    !agreedTerms ||
                                                    !buyerForm.fullName.trim() ||
                                                    !buyerForm.phone.trim() ||
                                                    !buyerForm.email.trim()
                                                }
                                                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {paying ? "Đang chuyển đến SePay..." : "Thanh toán qua SePay"}
                                            </button>
                                        </>
                                    )}
                                    {order.status === "EXPIRED" && (order.eventId || order.items[0]?.ticketType.event.id) && (
                                        <Link
                                            to={`/events/${encodeURIComponent(order.eventId || order.items[0].ticketType.event.id)}`}
                                            className="block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
                                        >
                                            Đặt lại vé
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </main>
            <Footer />
            {showLeaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-[2px]">
                    <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-center text-lg font-bold text-slate-900">Hủy đơn hàng?</h2>
                        <p className="mt-3 text-sm text-slate-600">Bạn có chắc chắn muốn tiếp tục?</p>
                        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                            <li>Bạn sẽ mất vị trí mình đã lựa chọn.</li>
                            <li>Đơn hàng đang trong quá trình thanh toán hoặc đã thanh toán thành công cũng có thể bị huỷ.</li>
                        </ul>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={cancelling}
                                className="rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-bold text-rose-500 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                                {cancelling ? "Đang hủy..." : "Hủy đơn"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowLeaveModal(false)}
                                disabled={cancelling}
                                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                            >
                                Ở lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
