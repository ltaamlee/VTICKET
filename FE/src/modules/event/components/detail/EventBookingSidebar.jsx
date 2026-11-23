import { ShieldCheck, Zap, HelpCircle } from "lucide-react";
import EventBadge from "../common/EventBadge";

export default function EventBookingSidebar({
    event,
    onBuyClick,
    selectedSession,
}) {
    if (!event) return null;

    const now = new Date();
    const sessionCount = event.sessions?.length || 0;
    const isEnded =
        event.ticketStatus === "ENDED" ||
        (selectedSession && new Date(selectedSession.endAt) <= now);
    const isUpcoming = event.ticketStatus === "UPCOMING";
    const isSoldOut = event.ticketStatus === "SOLD_OUT";
    const isUnannounced = event.ticketStatus === "UNANNOUNCED";
    const ticketStatus = isEnded
        ? "ENDED"
        : isUpcoming
          ? "UPCOMING"
          : isSoldOut
            ? "SOLD_OUT"
            : isUnannounced ? "UNANNOUNCED" : "SELLING";
    const priceRange = event.priceRange;

    const formatPrice = (priceRange) => {
        if (!priceRange || priceRange.isFree) return "Miễn phí";
        if (priceRange.minPrice === priceRange.maxPrice) {
            return `${Number(priceRange.minPrice).toLocaleString("vi-VN")} đ`;
        }
        return `Từ ${Number(priceRange.minPrice).toLocaleString("vi-VN")} đ`;
    };

    const formatSession = (session) => {
        const start = new Date(session.startAt);
        const end = new Date(session.endAt);
        const time = (date) =>
            date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

        return `${time(start)} - ${time(end)}, ${start.toLocaleDateString("vi-VN")}`;
    };

    const getButtonText = () => {
        if (isEnded) return "Sự kiện đã kết thúc";
        if (isSoldOut) return "Đã hết vé";
        if (isUpcoming) return "Sắp mở bán";
        if (isUnannounced) return "Chưa công bố mở bán";
        return sessionCount > 1 ? "Chọn suất & vé" : "Chọn vé ngay";
    };

    return (
        <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            {/* Giá vé & Trạng thái */}
            <div className="pb-4 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Giá vé tham dự</span>
                <div className="mt-1 flex items-baseline justify-between gap-2">

                    <span className="text-2xl font-black text-blue-600 tracking-tight">
                        {formatPrice(priceRange)}
                    </span>
                    <EventBadge status={ticketStatus} size="sm" />
                </div>
            </div>

            {/* Thông tin nhanh số lượng hạng vé */}
            <div className="space-y-2 text-xs text-slate-600">
                {sessionCount > 0 && (
                    <div className="flex items-center justify-between">
                        <span>Số suất diễn:</span>
                        <span className="font-bold text-slate-900">{sessionCount} suất</span>
                    </div>
                )}
                {selectedSession && (
                    <div className="flex items-start justify-between gap-3">
                        <span className="shrink-0">Suất đang chọn:</span>
                        <span className="text-right font-bold text-slate-900">
                            {formatSession(selectedSession)}
                        </span>
                    </div>
                )}
                {event.seatMap && (
                    <div className="flex items-center justify-between">
                        <span>Hình thức chỗ ngồi:</span>
                        <span className="font-bold text-slate-900">Có sơ đồ phân khu</span>
                    </div>
                )}
            </div>

            {/* Nút hành động Mua vé */}
            <button
                type="button"
                disabled={isSoldOut || isEnded || isUnannounced}
                onClick={onBuyClick}
                className={`w-full rounded-xl py-3.5 px-4 text-sm font-bold transition ${
                    isSoldOut || isEnded || isUnannounced
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 active:scale-[0.99] cursor-pointer"
                }`}
            >
                {getButtonText()}
            </button>

            {/* Các cam kết an toàn */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Thanh toán bảo mật & bảo vệ người mua</span>
                </div>
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-slate-600 shrink-0" />
                    <span>Tra cứu vé trong đơn hàng sau khi thanh toán</span>
                </div>
                <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Hỗ trợ kỹ thuật 24/7 trong suốt sự kiện</span>
                </div>
            </div>
        </div>
    );
}
