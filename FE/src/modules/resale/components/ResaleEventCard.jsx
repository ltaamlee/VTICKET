import { Link } from "react-router-dom";
import { Calendar, MapPin, Building2 } from "lucide-react";

import { formatResalePrice } from "../constants/resaleConstants";

/**
 * ResaleEventCard - Thẻ sự kiện trên sàn vé bán lại.
 *
 * Giống kiểu Card Sự Kiện của trang /events (Ticketbox style):
 * bấm vào thẻ sẽ mở danh sách các vé bán lại thuộc sự kiện đó.
 */
export default function ResaleEventCard({ event }) {
    if (!event) return null;

    const eventUrl = `/resales/events/${event.id}`;
    const resaleCount = Number(event.resaleCount) || 0;

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    return (
        <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:border-blue-300 hover:shadow-md">
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
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-medium text-gray-400">
                        VTICKET EVENT
                    </div>
                )}

                {/* Badge "Vé bán lại" */}
                <div className="absolute left-3 top-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-[11px] font-medium text-white">
                        Vé bán lại
                    </span>
                </div>

                {/* Số lượng vé đang bán lại */}
                {resaleCount > 0 && (
                    <div className="absolute right-3 top-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-gray-900">
                            {resaleCount} vé
                        </span>
                    </div>
                )}

                {/* Danh mục */}
                {event.category && (
                    <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
                        {event.category.name}
                    </span>
                )}
            </Link>

            {/* Nội dung thẻ */}
            <div className="flex flex-1 flex-col p-5">
                {/* Thời gian */}
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-blue-600">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(event.startAt)}</span>
                </div>

                {/* Tên sự kiện */}
                <Link to={eventUrl}>
                    <h3
                        className="line-clamp-2 text-base font-semibold text-gray-900 transition group-hover:text-blue-600"
                        title={event.name}
                    >
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
                    </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <div>
                        <span className="block text-[11px] font-medium text-gray-400">
                            Giá bán lại
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                            {event.resaleMinPrice != null
                                ? `Từ ${formatResalePrice(event.resaleMinPrice)}`
                                : "Liên hệ"}
                        </span>
                    </div>

                    <Link
                        to={eventUrl}
                        className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                    >
                        Xem vé bán lại
                    </Link>
                </div>
            </div>
        </div>
    );
}
