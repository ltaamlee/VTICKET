import { Link } from "react-router-dom";
import { Calendar, MapPin, Building2, CheckCircle2 } from "lucide-react";
import EventBadge from "./EventBadge";

/**
 * EventCard - Thẻ sự kiện dùng trong danh sách, kết quả tìm kiếm và trang chủ
 */
export default function EventCard({ event }) {
    if (!event) return null;

    const eventUrl = `/events/${event.slug || event.id}`;

    // Format ngày giờ hiển thị
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // Format giá tiền hiển thị
    const formatPrice = (priceRange) => {
        if (!priceRange || priceRange.isFree) {
            return "Miễn phí";
        }
        if (priceRange.minPrice === priceRange.maxPrice) {
            return `${Number(priceRange.minPrice).toLocaleString("vi-VN")} đ`;
        }
        return `Từ ${Number(priceRange.minPrice).toLocaleString("vi-VN")} đ`;
    };

    return (
        <div className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-200/80 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-300">
            {/* Ảnh đại diện sự kiện */}
            <Link to={eventUrl} className="relative block h-48 w-full overflow-hidden bg-gray-100">
                {event.thumbnailUrl || event.bannerUrl ? (
                    <img
                        src={event.thumbnailUrl || event.bannerUrl}
                        alt={event.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-400 font-semibold text-sm">
                        VTICKET EVENT
                    </div>
                )}

                {/* Badge trạng thái bán vé */}
                <div className="absolute top-3 left-3">
                    <EventBadge status={event.ticketStatus} size="sm" />
                </div>

                {/* Danh mục */}
                {event.category && (
                    <span className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-xs">
                        {event.category.name}
                    </span>
                )}
            </Link>

            {/* Nội dung thông tin thẻ */}
            <div className="flex flex-1 flex-col p-5">
                {/* Thời gian */}
                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 mb-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(event.startAt)}</span>
                </div>

                {/* Tên sự kiện */}
                <Link to={eventUrl}>
                    <h3 className="line-clamp-2 text-base font-bold text-gray-900 group-hover:text-blue-600 transition" title={event.name}>
                        {event.name}
                    </h3>
                </Link>

                {/* Địa điểm */}
                <div className="mt-2.5 flex items-start gap-1.5 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400 mt-0.5" />
                    <span className="line-clamp-1">{event.location || "Đang cập nhật địa điểm"}</span>
                </div>

                {/* Ban tổ chức */}
                {event.organizer && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        <span className="line-clamp-1 font-medium">{event.organizer.name}</span>
                        {event.organizer.isVerified && (
                            <CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0" title="Ban tổ chức đã xác minh" />
                        )}
                    </div>
                )}

                {/* Chân thẻ: Giá vé và Nút xem chi tiết */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <div>
                        <span className="block text-[11px] text-gray-400 font-medium">Giá vé</span>
                        <span className="text-sm font-bold text-gray-900">
                            {formatPrice(event.priceRange)}
                        </span>
                    </div>

                    <Link
                        to={eventUrl}
                        className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                    >
                        Xem chi tiết
                    </Link>
                </div>
            </div>
        </div>
    );
}

