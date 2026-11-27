import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    ShieldCheck,
    Ticket,
    Wallet,
    Landmark,
} from "lucide-react";

import Header from "../../../layout/Header";
import Footer from "../../../layout/Footer";
import ConfirmModal from "../../../components/common/ConfirmModal";
import {
    cancelResalePurchaseOrder,
    checkoutResalePurchaseOrder,
    getResalePurchaseOrder,
    payResalePurchaseOrderWithWallet,
} from "../services/resaleService";
import { getWalletOverview } from "../../wallet/services/walletService";
import { formatResalePrice } from "../constants/resaleConstants";
import { useAuth } from "../../../contexts/AuthContext";

function money(amount) {
    return `${Number(amount || 0).toLocaleString("vi-VN")} đ`;
}

/**
 * ResaleOrderPage - Trang thanh toán đơn mua vé bán lại.
 *
 * Người mua chọn:
 * - Thanh toán qua cổng ngân hàng (SePay)
 * - Thanh toán bằng số dư ví điện tử nội bộ
 *
 * Chỉ khi thanh toán thành công, vé mới được chuyển sang tài khoản
 * người mua kèm mã vé và QR MỚI.
 */
export default function ResaleOrderPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();

    const [order, setOrder] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [walletSettings, setWalletSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [paying, setPaying] = useState(false);
    const [payMethod, setPayMethod] = useState("SEPAY");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [paidTicket, setPaidTicket] = useState(null);

    const isReturnFromGateway = searchParams.get("payment") === "success";

    // Đếm ngược thời gian giữ vé (đơn hết hạn sau 15 phút)
    const [remainingSeconds, setRemainingSeconds] = useState(null);

    useEffect(() => {
        if (!order?.expiresAt || order.status !== "PENDING_PAYMENT") {
            setRemainingSeconds(null);
            return undefined;
        }

        const deadline = new Date(order.expiresAt).getTime();

        const tick = () => {
            const diff = Math.max(
                0,
                Math.floor((deadline - Date.now()) / 1000)
            );
            setRemainingSeconds(diff);
        };

        tick();
        const timer = setInterval(tick, 1000);

        return () => clearInterval(timer);
    }, [order?.expiresAt, order?.status]);

    // Nếu admin tắt thanh toán bằng ví -> ép dùng cổng ngân hàng
    useEffect(() => {
        if (
            walletSettings &&
            walletSettings.allowWalletPayment === false &&
            payMethod === "WALLET"
        ) {
            setPayMethod("SEPAY");
        }
    }, [walletSettings, payMethod]);

    // Tải đơn hàng
    useEffect(() => {
        let cancelled = false;

        async function fetchOrder() {
            try {
                setLoading(true);
                setError("");

                const response = await getResalePurchaseOrder(orderId);
                if (!cancelled) setOrder(response.data);
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Không thể tải thông tin đơn hàng");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchOrder();

        return () => {
            cancelled = true;
        };
    }, [orderId, isReturnFromGateway]);

    // Tải ví điện tử
    useEffect(() => {
        if (!isAuthenticated) return;

        let cancelled = false;

        getWalletOverview({ page: 1, pageSize: 5 })
            .then((response) => {
                if (cancelled) return;

                setWallet(response.data?.wallet ?? null);
                setWalletSettings(response.data?.settings ?? null);
            })
            .catch(() => {
                // Không có ví cũng dùng được cổng SePay
            });

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

    const handlePayWithGateway = async () => {
        try {
            setPaying(true);
            setError("");

            const response = await checkoutResalePurchaseOrder(orderId);
            const { url, fields } = response.data;

            const target = new URL(url);
            if (
                target.protocol !== "https:" ||
                !["pay.sepay.vn", "pay-sandbox.sepay.vn"].includes(target.hostname)
            ) {
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
            setError(err.message || "Không thể chuyển đến cổng thanh toán");
            setPaying(false);
        }
    };

    const handlePayWithWallet = async () => {
        try {
            setPaying(true);
            setError("");
            setConfirmOpen(false);

            const response = await payResalePurchaseOrderWithWallet(orderId);

            setOrder(response.data);

            const ticket = response.data?.resale?.ticket;
            if (ticket) setPaidTicket(ticket);
        } catch (err) {
            setError(err.message || "Không thể thanh toán bằng ví điện tử");
        } finally {
            setPaying(false);
        }
    };

    const handleCancel = async () => {
        try {
            await cancelResalePurchaseOrder(orderId);
        } catch {
            // Bỏ qua lỗi, điều hướng về sàn bán lại
        }
        navigate("/resales", { replace: true });
    };

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col bg-gray-50">
                <Header />
                <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
                    <div className="h-80 animate-pulse rounded-xl border border-gray-200 bg-white" />
                </main>
                <Footer />
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="flex min-h-screen flex-col bg-gray-50">
                <Header />
                <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
                        {error || "Không tìm thấy đơn hàng"}
                    </div>
                    <Link
                        to="/resales"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại sàn vé bán lại
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    if (!order) return null;

    const ticket = order.resale?.ticket || {};
    const event = ticket.event || {};
    const ticketType = ticket.ticketType || {};
    const isPaid = order.status === "PAID";
    const walletBalance = Number(wallet?.availableBalance ?? 0);
    const enoughBalance = walletBalance >= Number(order.totalAmount);
    const walletPaymentAllowed =
        walletSettings?.allowWalletPayment !== false &&
        walletSettings?.enabled !== false;

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            <Header />

            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
                <Link
                    to="/resales"
                    className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-blue-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại sàn vé bán lại
                </Link>

                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Thanh toán mua vé bán lại
                    </h1>

                    <span
                        className={`inline-flex items-center rounded-full border px-3.5 py-1 text-sm font-semibold ${
                            isPaid
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                    >
                        {isPaid ? "Đã thanh toán" : "Chờ thanh toán"}
                    </span>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                    >
                        {error}
                    </div>
                )}

                {/* Đồng hồ giữ vé */}
                {!isPaid && remainingSeconds !== null && (
                    <div
                        className={`mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold ${
                            remainingSeconds < 120
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                    >
                        <Clock className="h-4 w-4 shrink-0" />
                        Vé đang được giữ cho bạn. Vui lòng thanh toán trong{" "}
                        {Math.floor(remainingSeconds / 60)}:
                        {String(remainingSeconds % 60).padStart(2, "0")}
                        {" "}— hết thời gian vé sẽ được trả lại người bán.
                    </div>
                )}

                {/* Vé vừa mua: mã vé + QR mới */}
                {paidTicket && (
                    <div className="mb-6 overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/70 px-4 py-2.5 text-xs font-semibold text-emerald-800">
                            <Ticket className="h-4 w-4" />
                            Vé của bạn đã mua — mã vé và QR mới
                        </div>

                        <div className="flex flex-col items-center gap-4 p-5 sm:flex-row">
                            {paidTicket.qrToken && (
                                <div className="shrink-0 rounded-xl border border-gray-200 bg-white p-2">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                                            paidTicket.qrToken
                                        )}`}
                                        alt={`QR vé ${paidTicket.ticketCode || ""}`}
                                        className="h-32 w-32 rounded object-contain"
                                    />
                                </div>
                            )}

                            <div className="min-w-0 flex-1 text-center sm:text-left">
                                <p className="text-xs font-medium text-gray-500">
                                    Mã vé
                                </p>
                                <p className="mt-0.5 font-mono text-base font-semibold text-gray-900">
                                    {paidTicket.ticketCode || "—"}
                                </p>

                                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                                    Mã QR này là mã mới dành riêng cho bạn, mã cũ
                                    của người bán đã bị vô hiệu hoá.
                                </p>

                                <Link
                                    to="/my-tickets"
                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    <Ticket className="h-3.5 w-3.5" />
                                    Xem trong Vé của tôi
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                    {/* Cột trái: chi tiết vé + phương thức thanh toán */}
                    <div className="space-y-6">
                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            {event.thumbnailUrl && (
                                <div className="h-44 w-full overflow-hidden bg-gray-100">
                                    <img
                                        src={event.thumbnailUrl}
                                        alt={event.name || "Sự kiện"}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            )}

                            <div className="space-y-3 p-6">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {event.name || "Sự kiện"}
                                </h2>

                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                        {ticketType.name || "Vé điện tử"}
                                    </span>
                                    {ticket.seat && (
                                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                                            Ghế {ticket.seat.rowLabel}
                                            {ticket.seat.seatNumber}
                                        </span>
                                    )}
                                </div>

                                {event.startAt && (
                                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                        {new Date(
                                            event.startAt
                                        ).toLocaleString("vi-VN")}
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Phương thức thanh toán */}
                        {!isPaid && (
                            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 border-b border-gray-100 pb-3 text-base font-semibold text-gray-900">
                                    Phương thức thanh toán
                                </h2>

                                <div className="space-y-3">
                                    {/* Cổng ngân hàng */}
                                    <button
                                        type="button"
                                        onClick={() => setPayMethod("SEPAY")}
                                        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                                            payMethod === "SEPAY"
                                                ? "border-blue-500 bg-blue-50/60"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
                                            <Landmark className="h-4.5 w-4.5" />
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold text-gray-900">
                                                Cổng thanh toán ngân hàng (SePay)
                                            </span>
                                            <span className="mt-0.5 block text-xs text-gray-500">
                                                Chuyển khoản qua ngân hàng / ví MoMo,
                                                VNPay, PayOS
                                            </span>
                                        </span>

                                        <span
                                            className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                                                payMethod === "SEPAY"
                                                    ? "border-blue-600 bg-blue-600"
                                                    : "border-gray-300"
                                            }`}
                                        />
                                    </button>

                                    {/* Ví điện tử nội bộ */}
                                    <button
                                        type="button"
                                        onClick={() => setPayMethod("WALLET")}
                                        disabled={!wallet || !walletPaymentAllowed}
                                        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                            payMethod === "WALLET"
                                                ? "border-blue-500 bg-blue-50/60"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                                            <Wallet className="h-4.5 w-4.5" />
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold text-gray-900">
                                                Ví điện tử VTicket
                                            </span>
                                            <span className="mt-0.5 block text-xs text-gray-500">
                                                {!walletPaymentAllowed
                                                    ? "Thanh toán bằng ví hiện đang tạm ngưng"
                                                    : wallet
                                                    ? `Số dư khả dụng: ${money(
                                                          walletBalance
                                                      )}`
                                                    : "Bạn chưa có ví điện tử"}
                                            </span>
                                        </span>

                                        <span
                                            className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                                                payMethod === "WALLET"
                                                    ? "border-blue-600 bg-blue-600"
                                                    : "border-gray-300"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {payMethod === "WALLET" && wallet && !enoughBalance && (
                                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                                        Số dư ví chưa đủ. Vui lòng nạp thêm{" "}
                                        <Link
                                            to="/wallet"
                                            className="font-semibold underline"
                                        >
                                            tại ví điện tử
                                        </Link>{" "}
                                        hoặc chọn cổng thanh toán ngân hàng.
                                    </p>
                                )}
                            </section>
                        )}
                    </div>

                    {/* Cột phải: tóm tắt & thanh toán */}
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="border-b border-gray-100 pb-3 text-base font-semibold text-gray-900">
                                Tóm tắt đơn hàng
                            </h2>

                            <dl className="space-y-3 text-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <dt className="text-gray-500">Mã đơn</dt>
                                    <dd className="font-mono text-xs font-semibold text-gray-900">
                                        {order.orderCode}
                                    </dd>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <dt className="text-gray-500">Giá vé</dt>
                                    <dd className="font-semibold text-gray-900">
                                        {formatResalePrice(order.totalAmount)}
                                    </dd>
                                </div>

                                {Number(order.platformFee) > 0 && (
                                    <div className="flex items-center justify-between gap-2">
                                        <dt className="text-gray-500">Phí sàn</dt>
                                        <dd className="font-semibold text-gray-900">
                                            {formatResalePrice(order.platformFee)}
                                        </dd>
                                    </div>
                                )}

                                <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-base font-semibold text-gray-900">
                                    <dt>Tổng thanh toán</dt>
                                    <dd className="text-blue-600">
                                        {money(order.totalAmount)}
                                    </dd>
                                </div>
                            </dl>

                            {!isPaid && (
                                <div className="space-y-3 pt-2">
                                    {payMethod === "WALLET" ? (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmOpen(true)}
                                            disabled={
                                                paying || !wallet || !enoughBalance
                                            }
                                            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {paying
                                                ? "Đang thanh toán..."
                                                : "Thanh toán bằng ví"}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handlePayWithGateway}
                                            disabled={paying}
                                            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {paying
                                                ? "Đang chuyển đến cổng thanh toán..."
                                                : "Thanh toán qua cổng ngân hàng"}
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-rose-300 hover:text-rose-600"
                                    >
                                        Hủy đơn và trả vé cho người bán
                                    </button>
                                </div>
                            )}

                            {isPaid && (
                                <Link
                                    to="/my-tickets"
                                    className="block w-full rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
                                    Xem vé của tôi
                                </Link>
                            )}

                            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-400">
                                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                Vé chỉ được chuyển sang tài khoản bạn sau khi
                                thanh toán thành công. Mã vé và mã QR sẽ được
                                tạo mới hoàn toàn.
                            </p>
                        </div>
                    </aside>
                </div>
            </main>

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handlePayWithWallet}
                title="Xác nhận thanh toán bằng ví"
                message={`Thanh toán ${money(order.totalAmount)} từ ví điện tử?`}
                description={
                    <div className="space-y-2">
                        <p>
                            Số dư khả dụng hiện tại:{" "}
                            <span className="font-semibold">
                                {money(walletBalance)}
                            </span>
                        </p>
                        <p>
                            Sau khi thanh toán, vé sẽ được chuyển sang tài
                            khoản của bạn kèm mã vé và QR mới.
                        </p>
                    </div>
                }
                variant="primary"
                loading={paying}
            />

            <Footer />
        </div>
    );
}
