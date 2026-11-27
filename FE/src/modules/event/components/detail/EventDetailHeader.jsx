import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Calendar,
    CalendarClock,
    MapPin,
    Share2,
    Check,
    Building2,
    CheckCircle2,
    ArrowLeft,
    Ticket,
} from "lucide-react";
import EventBadge from "../common/EventBadge";

/**
 * EventDetailHeader - Banner và thông tin tổng quan đầu trang chi tiết sự kiện
 */
export default function EventDetailHeader({ event, onBuyClick, canBuy = true, blocked = false }) {
    const [copied, setCopied] = useState(false);

    if (!event) return null;

    const isSoldOut = event.ticketStatus === "SOLD_OUT";
    const isEnded = event.ticketStatus === "ENDED";
    const isUnannounced = event.ticketStatus === "UNANNOUNCED";
    const sessionCount = event.sessions?.length || 0;

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    // Format ngày giờ diễn ra
    const formatDateRange = (start, end) => {
        if (!start) return "";
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : null;

        const timeStr = startDate.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });

        const dateStr = startDate.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

        if (endDate) {
            const endTimeStr = endDate.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            });
            return `${timeStr} - ${endTimeStr}, ${dateStr}`;
        }

        return `${timeStr}, ${dateStr}`;
    };

    // Tách tên địa điểm chính và địa chỉ chi tiết
    const getLocationTitle = (location) => {
        if (!location) return "Địa điểm đang cập nhật";
        const parts = location.split(",");
        if (parts.length > 1) {
            return parts.slice(0, 2).join(",").trim();
        }
        return location;
    };

    const getLocationSubtitle = (location) => {
        if (!location) return "";
        const parts = location.split(",");
        if (parts.length > 2) {
            return parts.slice(2).join(",").trim();
        }
        return "";
    };

    // Format giá tiền vé
    const formatPrice = (priceRange) => {
        if (!priceRange || priceRange.isFree) return "Miễn phí";
        if (priceRange.minPrice === 0 && priceRange.maxPrice === 0) return "Miễn phí";
        return `${Number(priceRange.minPrice).toLocaleString("vi-VN")} đ`;
    };

    return (
        <div className="relative overflow-hidden border-b border-slate-200/80 py-8 sm:py-12 bg-slate-900/5">
            {/* Ảnh sự kiện làm banner phía sau mờ nhạt (ambient blur backdrop) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                    src={event.bannerUrl || event.thumbnailUrl}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover scale-125 filter blur-3xl opacity-35"
                />
                {/* Lớp phủ chuyển sắc để làm ảnh mờ nhạt, dịu mắt và nội dung nổi bật */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-slate-100/80 to-slate-100/95" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
                {/* Thanh điều hướng quay lại & nút chia sẻ */}
                <div className="mb-5 flex items-center justify-between">
                    <Link
                        to="/events"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 transition bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/80 shadow-2xs"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại danh sách sự kiện
                    </Link>

                    <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-white hover:text-blue-600 cursor-pointer"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-semibold">Đã sao chép liên kết!</span>
                            </>
                        ) : (
                            <>
                                <Share2 className="h-3.5 w-3.5 text-slate-500" />
                                <span>Chia sẻ</span>
                            </>
                        )}
                    </button>
                </div>

                {/* KHUNG THẺ VÉ TICKET-STUB NỔI BẬT */}
                <div className="relative overflow-hidden rounded-3xl bg-white border border-white/80 shadow-2xl shadow-slate-900/10 flex flex-col-reverse lg:flex-row items-stretch">
                    {/* CỘT TRÁI: Cuống vé thông tin sự kiện */}
                    <div className="w-full lg:w-[440px] xl:w-[480px] p-6 sm:p-8 flex flex-col justify-between shrink-0 bg-white relative border-t lg:border-t-0 lg:border-r border-dashed border-slate-300">
                        {/* Vết cắt tròn (Ticket Notches) tạo hình cuống vé trên Desktop */}
                        <div className="hidden lg:block absolute -top-4 -right-4 w-8 h-8 rounded-full bg-slate-100/90 ring-1 ring-slate-200/80 z-20" />
                        <div className="hidden lg:block absolute -bottom-4 -right-4 w-8 h-8 rounded-full bg-slate-100/90 ring-1 ring-slate-200/80 z-20" />

                        {/* Vết cắt tròn tạo hình cuống vé trên Mobile */}
                        <div className="lg:hidden absolute -top-3.5 -left-3.5 w-7 h-7 rounded-full bg-slate-100/90 ring-1 ring-slate-200/80 z-20" />
                        <div className="lg:hidden absolute -top-3.5 -right-3.5 w-7 h-7 rounded-full bg-slate-100/90 ring-1 ring-slate-200/80 z-20" />

                        <div className="space-y-4">
                            {/* Badges danh mục & trạng thái */}
                            <div className="flex flex-wrap items-center gap-2">
                                <EventBadge status={event.ticketStatus} size="sm" />
                                {event.category && (
                                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
                                        {event.category.name}
                                    </span>
                                )}
                            </div>

                            {/* Tên sự kiện */}
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight uppercase">
                                {event.name}
                            </h1>

                            {/* Khối thông tin Thời gian - Địa điểm - Ban tổ chức */}
                            <div className="space-y-3 pt-1">
                                {/* Thời gian */}
                                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-800">
                                    <Calendar className="h-4 w-4 shrink-0 text-blue-600" />
                                    <span>{formatDateRange(event.startAt, event.endAt)}</span>
                                </div>

                                {/* Số suất diễn */}
                                {sessionCount > 0 && (
                                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-800">
                                        <CalendarClock className="h-4 w-4 shrink-0 text-blue-600" />
                                        <span>{sessionCount} suất diễn</span>
                                    </div>
                                )}

                                {/* Địa điểm */}
                                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                                    <MapPin className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <span className="block font-bold text-slate-900">
                                            {getLocationTitle(event.location)}
                                        </span>
                                        {getLocationSubtitle(event.location) && (
                                            <span className="block text-xs text-slate-500 leading-relaxed line-clamp-2">
                                                {getLocationSubtitle(event.location)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Ban tổ chức */}
                                {event.organizer && (
                                    <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>Đơn vị tổ chức: <strong className="text-slate-800 font-semibold">{event.organizer.name}</strong></span>
                                        {event.organizer.isVerified && (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" title="Đã xác minh" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Đường kẻ phân cách & Khối Mua vé */}
                        <div className="pt-6 mt-6 border-t border-slate-200">
                            {/* Dòng hiển thị giá vé */}
                            <div className="flex items-center justify-between mb-3.5">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xs sm:text-sm font-medium text-slate-500">Giá từ</span>
                                    <span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
                                        {formatPrice(event.priceRange)}
                                    </span>
                                </div>
                            </div>

                            {/* Nút MUA VÉ NGAY nổi bật */}
                            <button
                                type="button"
                                disabled={!canBuy || blocked || isSoldOut || isEnded || isUnannounced}
                                onClick={onBuyClick}
                                className={`w-full rounded-xl py-3.5 px-6 font-bold text-base transition flex items-center justify-center gap-2 ${
                                    !canBuy || blocked || isSoldOut || isEnded || isUnannounced
                                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 active:scale-[0.99] cursor-pointer"
                                }`}
                            >
                                <Ticket className="h-5 w-5" />
                                <span>{!canBuy ? "Chỉ khách hàng được mua vé" : blocked ? "Cần xử lý lượt mua trước" : isSoldOut ? "Đã hết vé" : isEnded ? "Sự kiện đã kết thúc" : isUnannounced ? "Chưa công bố mở bán" : "Mua vé ngay"}</span>
                            </button>
                        </div>
                    </div>

                    {/* CỘT PHẢI: Banner chính của sự kiện */}
                    <div className="flex-1 relative overflow-hidden bg-slate-900 min-h-[260px] sm:min-h-[340px] lg:min-h-[420px]">
                        <img
                            src={event.bannerUrl || event.thumbnailUrl}
                            alt={event.name}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
