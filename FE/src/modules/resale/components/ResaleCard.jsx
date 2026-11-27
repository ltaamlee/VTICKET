import { Link } from "react-router-dom";
import { Clock, MapPin, Ticket, TrendingDown, TrendingUp, Minus } from "lucide-react";

import {
    getResaleStatus,
    getResaleEventDate,
    getResalePriceDiff,
    formatResalePrice,
} from "../constants/resaleConstants";

/**
 * ResaleCard - Thẻ tin bán vé trên sàn vé bán lại.
 * Lấy cảm hứng từ kiểu vé "cuống vé" của Ticketbox (module ticket).
 */
export default function ResaleCard({
    listing,
    onCancel,
    onPurchase,
    busy = false,
    showActions = false,
}) {
    if (!listing) return null;

    const ticket = listing.ticket || {};
    const event = ticket.event || {};
    const ticketType = ticket.ticketType || {};
    const seat = ticket.seat;
    const status = getResaleStatus(listing.status);
    const eventDate = getResaleEventDate(listing);
    const priceDiff = getResalePriceDiff(listing);

    const DiffIcon = !priceDiff
        ? Minus
        : priceDiff.diff === 0
          ? Minus
          : priceDiff.isCheaper
            ? TrendingDown
            : TrendingUp;

    return (
        <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:border-blue-300 hover:shadow-md sm:flex-row">
            {/* Cuống vé: ngày / tháng / năm */}
            {eventDate && (
                <div className="flex shrink-0 items-center justify-center gap-2 border-b border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-center sm:w-28 sm:flex-col sm:gap-0.5 sm:border-b-0 sm:border-r sm:py-5">
                    <span className="text-2xl font-extrabold leading-none text-gray-900 sm:text-3xl">
                        {eventDate.getDate()}
                    </span>
                    <span className="text-xs font-medium text-gray-600">
                        Tháng {eventDate.getMonth() + 1}
                    </span>
                    <span className="text-xs text-gray-400">
                        {eventDate.getFullYear()}
                    </span>
                </div>
            )}

            {/* Thumbnail sự kiện */}
            {event.thumbnailUrl ? (
                <div className="relative h-36 shrink-0 overflow-hidden bg-gray-100 sm:h-auto sm:w-44">
                    <img
                        src={event.thumbnailUrl}
                        alt={event.name || "Sự kiện"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                </div>
            ) : (
                <div className="flex h-32 shrink-0 items-center justify-center bg-gray-100 text-gray-300 sm:h-auto sm:w-44">
                    <Ticket className="h-10 w-10" />
                </div>
            )}

            {/* Nội dung */}
            <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                <div className="space-y-2.5">
                    <Link
                        to={`/resales/${listing.id}`}
                        className="line-clamp-2 text-base font-semibold text-gray-900 transition group-hover:text-blue-600"
                    >
                        {event.name || "Sự kiện"}
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                        >
                            {status.label}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {ticketType.name || "Vé điện tử"}
                        </span>
                        {seat && (
                            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                Ghế {seat.rowLabel}
                                {seat.seatNumber}
                                {seat.zone?.name ? ` · ${seat.zone.name}` : ""}
                            </span>
                        )}
                    </div>

                    <div className="space-y-1 pt-1 text-xs text-gray-600">
                        {ticketType.session?.startAt && (
                            <p className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                {new Date(ticketType.session.startAt).toLocaleString(
                                    "vi-VN"
                                )}
                            </p>
                        )}
                        {event.location && (
                            <p className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                <span className="line-clamp-1">{event.location}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <div>
                        <span className="block text-[11px] text-gray-400">
                            Giá bán lại
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-blue-600">
                                {formatResalePrice(listing.price)}
                            </span>
                            
                        </div>
                    </div>

                    {showActions ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {onPurchase && listing.status === "AVAILABLE" && (
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => onPurchase(listing)}
                                    className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Mua vé này
                                </button>
                            )}
                            {onCancel && listing.status === "AVAILABLE" && (
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => onCancel(listing)}
                                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Hủy bán
                                </button>
                            )}
                            <Link
                                to={`/resales/${listing.id}`}
                                className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-600"
                            >
                                Chi tiết
                            </Link>
                        </div>
                    ) : (
                        <Link
                            to={`/resales/${listing.id}`}
                            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
                        >
                            Xem chi tiết
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
