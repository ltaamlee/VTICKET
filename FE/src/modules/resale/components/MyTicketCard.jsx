import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Clock,
    MapPin,
    Ticket,
    QrCode,
    Repeat2,
    Ban,
    CheckCircle2,
    ChevronDown,
    Tag,
} from "lucide-react";

import { formatResalePrice } from "../constants/resaleConstants";

/**
 * MyTicketCard - Thẻ vé cá nhân trong trang "Vé của tôi".
 * Hiển thị trạng thái check-in / đang bán lại / có thể bán lại,
 * kèm nút bấm "Bán lại" trực tiếp.
 */
export default function MyTicketCard({ ticket, onResell, busy = false }) {
    const [expanded, setExpanded] = useState(false);

    if (!ticket) return null;

    const event = ticket.event || {};
    const ticketType = ticket.ticketType || {};
    const seat = ticket.seat;
    const resale = ticket.resale;

    const eventDate = ticketType.session?.startAt
        ? new Date(ticketType.session.startAt)
        : event.startAt
        ? new Date(event.startAt)
        : null;

    const isCheckedIn = ticket.status === "CHECKED_IN" || Boolean(ticket.checkInAt);
    const isOnResale = Boolean(resale && resale.status === "AVAILABLE");
    const isResaleSold = Boolean(resale && resale.status === "SOLD");
    const canResell = ticket.canResell === true;

    // Trạng thái hiển thị
    let statusBadge = null;
    if (isCheckedIn) {
        statusBadge = {
            label: "Đã check-in",
            className: "bg-gray-100 text-gray-600 border-gray-200",
            icon: CheckCircle2,
        };
    } else if (isOnResale) {
        statusBadge = {
            label: "Đang bán lại",
            className: "bg-amber-50 text-amber-700 border-amber-200",
            icon: Repeat2,
        };
    } else if (isResaleSold) {
        statusBadge = {
            label: "Đã bán lại",
            className: "bg-emerald-50 text-emerald-700 border-emerald-200",
            icon: CheckCircle2,
        };
    } else if (canResell) {
        statusBadge = {
            label: "Có thể bán lại",
            className: "bg-blue-50 text-blue-700 border-blue-200",
            icon: Tag,
        };
    } else {
        statusBadge = {
            label: "Chưa sử dụng",
            className: "bg-gray-100 text-gray-600 border-gray-200",
            icon: Ticket,
        };
    }

    const StatusIcon = statusBadge.icon;

    return (
        <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:shadow-md hover:border-blue-200">
            <div className="flex flex-col sm:flex-row">
                {/* Cột trái: ảnh sự kiện + ngày */}
                <div className="relative sm:w-56 sm:shrink-0">
                    {event.thumbnailUrl ? (
                        <img
                            src={event.thumbnailUrl}
                            alt={event.name || "Sự kiện"}
                            className="h-40 w-full object-cover sm:h-full"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-300 sm:h-full">
                            <Ticket className="h-10 w-10" />
                        </div>
                    )}

                    {eventDate && (
                        <div className="absolute left-3 top-3 flex flex-col items-center rounded-xl bg-white/95 px-3 py-2 text-center shadow-md backdrop-blur">
                            <span className="text-xl font-extrabold leading-none text-gray-900">
                                {eventDate.getDate()}
                            </span>
                            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                Th{eventDate.getMonth() + 1}
                            </span>
                        </div>
                    )}
                </div>

                {/* Cột phải: nội dung */}
                <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <Link
                                to={`/events/${event.id}`}
                                className="line-clamp-2 text-base font-bold text-gray-900 transition hover:text-blue-600"
                            >
                                {event.name || "Sự kiện"}
                            </Link>
                            <p className="mt-1 text-xs font-semibold text-gray-500">
                                {ticketType.name || "Vé điện tử"}
                                {seat ? (
                                    <span className="ml-2 rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-600">
                                        Ghế {seat.rowLabel}
                                        {seat.seatNumber}
                                    </span>
                                ) : null}
                            </p>
                        </div>

                        <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge.className}`}
                        >
                            <StatusIcon className="h-3 w-3" />
                            {statusBadge.label}
                        </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        {ticketType.session?.startAt && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                {new Date(ticketType.session.startAt).toLocaleString("vi-VN")}
                            </span>
                        )}
                        {event.location && (
                            <span className="flex min-w-0 items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                <span className="line-clamp-1">{event.location}</span>
                            </span>
                        )}
                    </div>

                    <div className="mt-auto pt-4">
                        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-3">
                            <div>
                                <p className="text-[11px] font-medium text-gray-400">
                                    {isOnResale ? "Giá đang bán lại" : "Giá vé"}
                                </p>
                                <p className="text-base font-bold text-gray-900">
                                    {isOnResale
                                        ? formatResalePrice(resale.price)
                                        : formatResalePrice(ticketType.price)}
                                </p>
                                <p className="mt-0.5 font-mono text-[11px] text-gray-400">
                                    {ticket.ticketCode}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Nút bán lại */}
                                {canResell && (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => onResell?.(ticket)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Repeat2 className="h-3.5 w-3.5" />
                                        Bán lại vé
                                    </button>
                                )}

                                {isOnResale && resale.id && (
                                    <Link
                                        to={`/resales/${resale.id}`}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                                    >
                                        Xem tin bán
                                    </Link>
                                )}

                                {isResaleSold && (
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-700">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Vé đã chuyển cho người mua
                                    </span>
                                )}

                                {!canResell && !isOnResale && !isResaleSold && (
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3.5 py-2 text-xs font-medium text-gray-400">
                                        <Ban className="h-3.5 w-3.5" />
                                        Không thể bán lại
                                    </span>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setExpanded((prev) => !prev)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                                    aria-expanded={expanded}
                                >
                                    <QrCode className="h-3.5 w-3.5" />
                                    QR
                                    <ChevronDown
                                        className={`h-3 w-3 transition-transform ${
                                            expanded ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* QR code mở rộng */}
                        {expanded && (
                            <div className="flex flex-col items-center gap-3 rounded-lg bg-gray-50 p-4 sm:flex-row sm:items-center">
                                <div className="shrink-0 rounded-lg border border-gray-200 bg-white p-2">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                                            ticket.qrToken || ticket.ticketCode || ticket.id
                                        )}`}
                                        alt={`QR vé ${ticket.ticketCode}`}
                                        className="h-24 w-24 rounded object-contain"
                                    />
                                </div>
                                <div className="min-w-0 flex-1 text-center sm:text-left">
                                    <p className="text-xs font-medium text-gray-700">
                                        Mã vé: {ticket.ticketCode}
                                    </p>
                                    <p className="mt-1 text-[11px] text-gray-500">
                                        Xuất trình mã này tại cổng check-in để vào
                                        sự kiện.
                                    </p>
                                    {ticket.issuedAt && (
                                        <p className="mt-1 text-[11px] text-gray-400">
                                            Phát hành:{" "}
                                            {new Date(ticket.issuedAt).toLocaleString("vi-VN")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
