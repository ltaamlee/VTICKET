import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Calendar,
    MapPin,
    Share2,
    Check,
    Building2,
    CheckCircle2,
    ArrowLeft,
    ChevronRight,
    Ticket,
} from "lucide-react";
import EventBadge from "../common/EventBadge";

/**
 * EventDetailHeader - Banner và thông tin tổng quan đầu trang chi tiết sự kiện
 */
export default function EventDetailHeader({ event, onBuyClick }) {
    const [copied, setCopied] = useState(false);

    if (!event) return null;

    const isSoldOut = event.ticketStatus === "SOLD_OUT";
    const isEnded = event.ticketStatus === "ENDED";

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
        <div className="relative bg-[#121418] text-white py-6 sm:py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Thanh điều hướng quay lại & nút chia sẻ */}
                <div className="mb-4 flex items-center justify-between">
                    <Link
                        to="/events"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại danh sách sự kiện
                    </Link>

                    <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-md transition hover:bg-white/20 hover:text-white cursor-pointer"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Đã sao chép liên kết!</span>
                            </>
                        ) : (
                            <>
                                <Share2 className="h-3.5 w-3.5" />
                                <span>Chia sẻ</span>
                            </>
                        )}
                    </button>
                </div>

                {/* KHUNG THẺ VÉ TICKET-STUB (Tương tự thiết kế Ticketbox) */}
                <div className="relative overflow-hidden rounded-2xl bg-[#1e222b] border border-gray-800 shadow-2xl flex flex-col-reverse lg:flex-row items-stretch">
                    {/* CỘT TRÁI: Cuống vé thông tin sự kiện */}
                    <div className="w-full lg:w-[430px] xl:w-[470px] p-6 sm:p-8 flex flex-col justify-between shrink-0 bg-[#242731] relative lg:border-r border-dashed border-gray-700/80">
                        {/* Vết cắt tròn (Ticket Notches) tạo hình cuống vé trên Desktop */}
                        <div className="hidden lg:block absolute -top-4 -right-4 w-8 h-8 rounded-full bg-[#121418] z-20" />
                        <div className="hidden lg:block absolute -bottom-4 -right-4 w-8 h-8 rounded-full bg-[#121418] z-20" />

                        {/* Vết cắt tròn tạo hình cuống vé trên Mobile */}
                        <div className="lg:hidden absolute -top-3.5 -left-3.5 w-7 h-7 rounded-full bg-[#121418] z-20" />
                        <div className="lg:hidden absolute -top-3.5 -right-3.5 w-7 h-7 rounded-full bg-[#121418] z-20" />

                        <div className="space-y-4">
                            {/* Badges danh mục & trạng thái */}
                            <div className="flex flex-wrap items-center gap-2">
                                <EventBadge status={event.ticketStatus} size="sm" />
                                {event.category && (
                                    <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-300 ring-1 ring-blue-400/30">
                                        {event.category.name}
                                    </span>
                                )}
                            </div>

                            {/* Tên sự kiện */}
                            <h1 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight uppercase">
                                {event.name}
                            </h1>

                            {/* Khối thông tin Thời gian - Địa điểm - Ban tổ chức */}
                            <div className="space-y-3 pt-1">
                                {/* Thời gian */}
                                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-emerald-400">
                                    <Calendar className="h-4 w-4 shrink-0 text-emerald-400" />
                                    <span>{formatDateRange(event.startAt, event.endAt)}</span>
                                </div>

                                {/* Địa điểm */}
                                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                                    <MapPin className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <span className="block font-bold text-emerald-400">
                                            {getLocationTitle(event.location)}
                                        </span>
                                        {getLocationSubtitle(event.location) && (
                                            <span className="block text-xs text-gray-400 leading-relaxed line-clamp-2">
                                                {getLocationSubtitle(event.location)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Ban tổ chức */}
                                {event.organizer && (
                                    <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                                        <Building2 className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                        <span>Đơn vị tổ chức: <strong className="text-gray-300">{event.organizer.name}</strong></span>
                                        {event.organizer.isVerified && (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" title="Đã xác minh" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Đường kẻ phân cách & Khối Mua vé */}
                        <div className="pt-6 mt-6 border-t border-gray-700/60">
                            {/* Dòng hiển thị giá vé */}
                            <div className="flex items-center justify-between mb-3.5">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xs sm:text-sm font-medium text-gray-300">Giá từ</span>
                                    <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                                        {formatPrice(event.priceRange)}
                                    </span>
                                    <ChevronRight className="h-5 w-5 text-emerald-400 inline -ml-0.5" />
                                </div>
                            </div>

                            {/* Nút MUA VÉ NGAY nổi bật */}
                            <button
                                type="button"
                                disabled={isSoldOut || isEnded}
                                onClick={onBuyClick}
                                className="w-full rounded-xl bg-[#00b14f] hover:bg-[#009e46] active:scale-[0.99] py-3.5 px-6 font-bold text-base text-white shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Ticket className="h-5 w-5" />
                                <span>{isSoldOut ? "Đã hết vé" : isEnded ? "Sự kiện đã kết thúc" : "Mua vé ngay"}</span>
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
