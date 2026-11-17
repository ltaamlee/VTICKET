import { ShieldCheck, Zap, HelpCircle } from "lucide-react";
import EventBadge from "../common/EventBadge";

export default function EventBookingSidebar({
    event,
    onBuyClick,
    selectedSession,
    ticketTypes = event?.ticketTypes || [],
}) {
    if (!event) return null;

    const now = new Date();
    const isEnded = selectedSession
        ? new Date(selectedSession.endAt) <= now
        : event.ticketStatus === "ENDED";
    const isUpcoming = selectedSession
        ? (selectedSession.saleStartAt &&
              new Date(selectedSession.saleStartAt) > now) ||
          (ticketTypes.length > 0 &&
              ticketTypes.every(
                  (ticket) => ticket.saleStartAt && new Date(ticket.saleStartAt) > now
              ))
        : event.ticketStatus === "UPCOMING";
    const isSoldOut = selectedSession
        ? ticketTypes.length === 0 ||
          ticketTypes.every((ticket) => ticket.remainingQuantity <= 0)
        : event.ticketStatus === "SOLD_OUT";
    const ticketStatus = isEnded
        ? "ENDED"
        : isUpcoming
          ? "UPCOMING"
          : isSoldOut
            ? "SOLD_OUT"
            : "SELLING";
    const prices = ticketTypes.map((ticket) => Number(ticket.price)).filter(Number.isFinite);
    const priceRange = selectedSession
        ? {
              minPrice: prices.length ? Math.min(...prices) : 0,
              maxPrice: prices.length ? Math.max(...prices) : 0,
              isFree: prices.length > 0 && prices.every((price) => price === 0),
          }
        : event.priceRange;

    const formatPrice = (priceRange) => {
        if (selectedSession && ticketTypes.length === 0) return "Chưa công bố";
        if (!priceRange || priceRange.isFree) return "Miễn phí";
        if (priceRange.minPrice === priceRange.maxPrice) {
            return `${Number(priceRange.minPrice).toLocaleString("vi-VN")} đ`;
        }
        return `Từ ${Number(priceRange.minPrice).toLocaleString("vi-VN")} đ`;
    };

    const getButtonText = () => {
        if (isEnded) return "Sự kiện đã kết thúc";
        if (isSoldOut) return selectedSession && !ticketTypes.length ? "Chưa có vé" : "Đã hết vé";
        if (isUpcoming) return "Sắp mở bán";
        return "Chọn vé ngay";
    };

    return (
        <div className="sticky top-20 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-lg space-y-6">
            {/* Giá vé & Trạng thái */}
            <div className="pb-4 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Giá vé tham dự</span>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="text-2xl font-black text-blue-600">
                        {formatPrice(priceRange)}
                    </span>
                    <EventBadge status={ticketStatus} size="sm" />
                </div>
            </div>

            {/* Thông tin nhanh số lượng hạng vé */}
            <div className="space-y-2 text-xs text-gray-600">
                {selectedSession && (
                    <div className="flex items-center justify-between gap-3">
                        <span>Suất diễn đã chọn:</span>
                        <span className="text-right font-bold text-gray-900">
                            {new Date(selectedSession.startAt).toLocaleString("vi-VN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                            })}
                        </span>
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <span>Số hạng vé mở bán:</span>
                    <span className="font-bold text-gray-900">{ticketTypes.length} hạng vé</span>
                </div>
                {event.seatMap && (
                    <div className="flex items-center justify-between">
                        <span>Hình thức chỗ ngồi:</span>
                        <span className="font-bold text-gray-900">Có sơ đồ phân khu</span>
                    </div>
                )}
            </div>

            {/* Nút hành động Mua vé */}
            <button
                type="button"
                disabled={isSoldOut || isEnded}
                onClick={onBuyClick}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {getButtonText()}
            </button>

            {/* Các cam kết an toàn */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Thanh toán bảo mật & bảo vệ người mua</span>
                </div>
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Nhận mã vé điện tử QR Code tức thì qua Email</span>
                </div>
                <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>Hỗ trợ kỹ thuật 24/7 trong suốt sự kiện</span>
                </div>
            </div>
        </div>
    );
}
