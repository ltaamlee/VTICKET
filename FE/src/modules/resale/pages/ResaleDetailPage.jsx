import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    Clock,
    MapPin,
    Ticket,
    Receipt,
    ArrowLeft,
} from "lucide-react";

import Header from "../../../layout/Header";
import Footer from "../../../layout/Footer";
import ConfirmModal from "../../../components/common/ConfirmModal";
import {
    getResaleListing,
    purchaseResaleListing,
} from "../services/resaleService";
import {
    getResaleStatus,
    getResaleEventDate,
    getResalePriceDiff,
    formatResalePrice,
} from "../constants/resaleConstants";
import { useAuth } from "../../../contexts/AuthContext";

export default function ResaleDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [purchaseError, setPurchaseError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchListing() {
            setLoading(true);
            setError("");

            try {
                const res = await getResaleListing(id);

                if (!cancelled) setListing(res.data);
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Không thể tải thông tin vé bán lại");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchListing();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handlePurchase = async () => {
        try {
            setPurchasing(true);
            setPurchaseError("");

            // Tạo đơn hàng thanh toán (vé được giữ lại cho người mua).
            // Vé chỉ chuyển sang tài khoản sau khi thanh toán thành công.
            const res = await purchaseResaleListing(id);

            const orderId = res?.data?.id;

            if (!orderId) {
                throw new Error("Không tạo được đơn mua vé bán lại");
            }

            setConfirmOpen(false);

            // Chuyển tới trang thanh toán đơn mua vé bán lại
            navigate(`/resales/orders/${encodeURIComponent(orderId)}`);
        } catch (err) {
            setPurchaseError(
                err.message || "Không thể mua vé. Vui lòng thử lại."
            );
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col bg-gray-50">
                <Header />
                <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
                    <div className="h-80 animate-pulse rounded-xl border border-gray-200 bg-white" />
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="flex min-h-screen flex-col bg-gray-50">
                <Header />
                <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
                        {error || "Không tìm thấy tin bán vé"}
                    </div>
                    <Link
                        to="/resales"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại danh sách
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    const ticket = listing.ticket || {};
    const event = ticket.event || {};
    const ticketType = ticket.ticketType || {};
    const seat = ticket.seat;
    const status = getResaleStatus(listing.status);
    const eventDate = getResaleEventDate(listing);
    const priceDiff = getResalePriceDiff(listing);

    const isSold = listing.status !== "AVAILABLE";
    const isOwnListing = user?.id && listing.sellerId === user.id;

    const handleBuyClick = () => {
        if (!isAuthenticated) {
            navigate("/login", { state: { from: `/resales/${id}` } });
            return;
        }
        setPurchaseError("");
        setConfirmOpen(true);
    };

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            <Header />

            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
                <Link
                    to="/resales"
                    className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-blue-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại danh sách vé bán lại
                </Link>

                <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                    {/* Cột trái: thông tin vé */}
                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            {event.thumbnailUrl ? (
                                <div className="relative h-56 w-full overflow-hidden bg-gray-900 sm:h-64">
                                    <img
                                        src={event.thumbnailUrl}
                                        alt={event.name || "Sự kiện"}
                                        className="h-full w-full object-cover opacity-90"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-40 w-full items-center justify-center bg-gray-100 text-gray-300">
                                    <Ticket className="h-12 w-12" />
                                </div>
                            )}

                            <div className="space-y-4 p-6">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <h1 className="text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
                                        {event.name || "Sự kiện"}
                                    </h1>
                                    <span
                                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
                                    >
                                        {status.label}
                                    </span>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl bg-gray-50 p-3">
                                        <p className="text-[11px] font-medium text-gray-400">
                                            Loại vé
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-gray-800">
                                            {ticketType.name || "Vé điện tử"}
                                        </p>
                                    </div>

                                    {ticketType.session?.startAt && (
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-[11px] font-medium text-gray-400">
                                                Thời gian
                                            </p>
                                            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                {new Date(
                                                    ticketType.session.startAt
                                                ).toLocaleString("vi-VN")}
                                            </p>
                                        </div>
                                    )}

                                    {event.location && (
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-[11px] font-medium text-gray-400">
                                                Địa điểm
                                            </p>
                                            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                <span className="line-clamp-2">
                                                    {event.location}
                                                </span>
                                            </p>
                                        </div>
                                    )}

                                    {seat && (
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-[11px] font-medium text-gray-400">
                                                Ghế
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-gray-800">
                                                {seat.rowLabel}
                                                {seat.seatNumber}
                                                {seat.zone?.name
                                                    ? ` · ${seat.zone.name}`
                                                    : ""}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bảng thông tin giao dịch */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-2.5 text-xs font-semibold text-gray-700">
                                <Receipt className="h-4 w-4 text-gray-500" />
                                Thông tin giao dịch
                            </div>
                            <div className="divide-y divide-gray-100 p-4 text-xs">
                                {ticket.ticketCode && (
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-gray-400">Mã vé</span>
                                        <span className="font-mono font-semibold text-gray-800">
                                            {ticket.ticketCode}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between py-1.5">
                                    <span className="text-gray-400">Thời điểm đăng bán</span>
                                    <span className="font-semibold text-gray-700">
                                        {listing.createdAt
                                            ? new Date(
                                                  listing.createdAt
                                              ).toLocaleString("vi-VN")
                                            : "—"}
                                    </span>
                                </div>
                                {eventDate && (
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-gray-400">
                                            Thời gian sự kiện
                                        </span>
                                        <span className="font-semibold text-gray-700">
                                            {eventDate.toLocaleString("vi-VN")}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: giá & thao tác */}
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-medium text-gray-400">
                                    Giá bán lại
                                </p>
                                <p className="mt-1 text-3xl font-extrabold text-blue-600">
                                    {formatResalePrice(listing.price)}
                                </p>

                                {priceDiff && (
                                    <p
                                        className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                                            priceDiff.diff > 0
                                                ? "text-amber-600"
                                                : priceDiff.diff === 0
                                                ? "text-gray-500"
                                                : "text-emerald-600"
                                        }`}
                                    >
                    
                                    </p>
                                )}

                                {ticketType.price > 0 && (
                                    <p className="mt-1 text-xs text-gray-400">
                                        Giá vé gốc:{" "}
                                        <span className="font-semibold text-gray-600">
                                            {formatResalePrice(ticketType.price)}
                                        </span>
                                    </p>
                                )}
                            </div>

                            {purchaseError && (
                                <p
                                    role="alert"
                                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                                >
                                    {purchaseError}
                                </p>
                            )}

                            {isOwnListing ? (
                                <div className="rounded-xl bg-gray-50 px-4 py-3 text-center text-xs font-medium text-gray-500">
                                    Đây là tin bán của chính bạn
                                </div>
                            ) : isSold ? (
                                <div className="rounded-xl bg-gray-100 px-4 py-3 text-center text-xs font-semibold text-gray-500">
                                    Vé này đã không còn khả dụng
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleBuyClick}
                                    className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                >
                                    Mua vé này
                                </button>
                            )}

                            <p className="text-center text-[11px] leading-relaxed text-gray-400">
                                Vé được giữ lại cho bạn trong thời gian thanh toán.
                                Mã vé và QR mới được tạo khi thanh toán thành công.
                            </p>

                            <Link
                                to="/my-resales"
                                className="block w-full rounded-lg border border-gray-200 px-5 py-2.5 text-center text-xs font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-600"
                            >
                                Quản lý tin bán của tôi
                            </Link>
                        </div>
                    </aside>
                </div>
            </main>

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handlePurchase}
                title="Xác nhận mua vé"
                message={`Mua vé với giá ${formatResalePrice(listing.price)}?`}
                description={
                    <div className="space-y-2">
                        <p>
                            Vé sẽ được giữ lại cho bạn trong khi thanh toán.
                            Sau khi thanh toán thành công, vé mới được chuyển
                            quyền sở hữu sang tài khoản của bạn kèm mã vé và
                            mã QR mới.
                        </p>
                        {purchaseError && (
                            <p className="font-semibold text-red-600">
                                {purchaseError}
                            </p>
                        )}
                    </div>
                }
                variant="warning"
                confirmText="Mua vé"
                loading={purchasing}
            />

            <Footer />
        </div>
    );
}
