import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Ticket,
    Plus,
    CheckCircle,
    XCircle,
} from "lucide-react";

import Pagination from "../../../components/common/Pagination";
import ConfirmModal from "../../../components/common/ConfirmModal";
import { Alert } from "../../../components/common/Arlet";
import ResaleList from "../components/ResaleList";
import ResaleForm from "../components/ResaleForm";
import {
    listMyResales,
    listMySellableTickets,
    cancelResaleListing,
} from "../services/resaleService";
import { RESALE_STATUS_TABS, formatResalePrice } from "../constants/resaleConstants";

export default function MyResalePage() {
    const [tab, setTab] = useState("listings");

    // Tab: tin bán của tôi
    const [listings, setListings] = useState([]);
    const [listingPagination, setListingPagination] = useState(null);
    const [listingPage, setListingPage] = useState(1);
    const [listingLoading, setListingLoading] = useState(true);
    const [listingError, setListingError] = useState("");

    // Tab: vé có thể bán
    const [sellableTickets, setSellableTickets] = useState([]);
    const [ticketPagination, setTicketPagination] = useState(null);
    const [ticketPage, setTicketPage] = useState(1);
    const [ticketLoading, setTicketLoading] = useState(true);
    const [ticketError, setTicketError] = useState("");

    // Thao tác
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [alert, setAlert] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");

    const handleAlert = (variant, message) => {
        setAlert({
            variant,
            title: variant === "success" ? "Thành công" : "Thất bại",
            message,
            icon: variant === "success" ? CheckCircle : XCircle,
        });
    };

    // Load tin bán
    useEffect(() => {
        let cancelled = false;

        async function fetchMyResales() {
            setListingLoading(true);
            setListingError("");

            try {
                const res = await listMyResales({ page: listingPage });

                if (!cancelled) {
                    setListings(res.data?.listings || []);
                    setListingPagination(res.data?.pagination || null);
                }
            } catch (err) {
                if (!cancelled) {
                    setListingError(
                        err.message || "Không thể tải danh sách tin bán"
                    );
                    setListings([]);
                }
            } finally {
                if (!cancelled) setListingLoading(false);
            }
        }

        fetchMyResales();

        return () => {
            cancelled = true;
        };
    }, [listingPage]);

    // Load vé có thể bán
    useEffect(() => {
        let cancelled = false;

        async function fetchSellableTickets() {
            setTicketLoading(true);
            setTicketError("");

            try {
                const res = await listMySellableTickets({ page: ticketPage });

                if (!cancelled) {
                    setSellableTickets(res.data?.tickets || []);
                    setTicketPagination(res.data?.pagination || null);
                }
            } catch (err) {
                if (!cancelled) {
                    setTicketError(
                        err.message || "Không thể tải danh sách vé có thể bán"
                    );
                    setSellableTickets([]);
                }
            } finally {
                if (!cancelled) setTicketLoading(false);
            }
        }

        fetchSellableTickets();

        return () => {
            cancelled = true;
        };
    }, [ticketPage]);

    const filteredListings = useMemo(() => {
        if (statusFilter === "all") return listings;
        return listings.filter((listing) => listing.status === statusFilter);
    }, [listings, statusFilter]);

    const refreshAll = async () => {
        const [res, ticketRes] = await Promise.all([
            listMyResales({ page: listingPage }),
            listMySellableTickets({ page: ticketPage }),
        ]);
        setListings(res.data?.listings || []);
        setSellableTickets(ticketRes.data?.tickets || []);
    };

    const handleCancel = async () => {
        if (!cancelTarget) return;

        try {
            setCancelling(true);
            setBusyId(cancelTarget.id);

            await cancelResaleListing(cancelTarget.id);

            setCancelTarget(null);
            handleAlert(
                "success",
                "Đã hủy tin bán vé. Vé đã trở lại tài khoản của bạn."
            );

            await refreshAll();
        } catch (err) {
            handleAlert(
                "error",
                err.message || "Không thể hủy tin bán vé. Vui lòng thử lại."
            );
        } finally {
            setCancelling(false);
            setBusyId(null);
        }
    };

    const handleCreateSuccess = (message) => {
        const ticketId = selectedTicket?.id;
        setSelectedTicket(null);
        handleAlert("success", message);

        setSellableTickets((prev) => prev.filter((t) => t.id !== ticketId));

        listMyResales({ page: listingPage }).then((res) =>
            setListings(res.data?.listings || [])
        );
    };

    return (
        <div className="space-y-6">
            {alert && (
                <div className="fixed right-5 top-5 z-50 w-full max-w-sm">
                    <Alert
                        variant={alert.variant}
                        title={alert.title}
                        icon={alert.icon}
                        duration={alert.variant === "success" ? 3000 : 5000}
                        onClose={() => setAlert(null)}
                        className="shadow-lg"
                    >
                        {alert.message}
                    </Alert>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Bán vé của tôi
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Quản lý tin bán lại và theo dõi doanh thu từ vé của bạn.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                {[
                    { key: "listings", label: "Tin bán của tôi" },
                    { key: "tickets", label: "Vé có thể bán" },
                ].map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setTab(item.key)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                            tab === item.key
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                        {item.label}
                        {item.key === "tickets" && sellableTickets.length > 0 && (
                            <span
                                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                    tab === item.key
                                        ? "bg-white/25 text-white"
                                        : "bg-blue-100 text-blue-700"
                                }`}
                            >
                                {sellableTickets.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {tab === "listings" ? (
                <>
                    {/* Bộ lọc trạng thái */}
                    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                        {RESALE_STATUS_TABS.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setStatusFilter(item.key)}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                    statusFilter === item.key
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <ResaleList
                        listings={filteredListings}
                        loading={listingLoading}
                        error={listingError}
                        emptyTitle="Chưa có tin bán nào"
                        emptyDescription="Chuyển sang tab 'Vé có thể bán' để đăng bán lại vé của bạn."
                        showActions
                        onCancel={setCancelTarget}
                        busyId={busyId}
                    />

                    {listingPagination && listingPagination.totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination
                                page={listingPagination.currentPage || 1}
                                totalPages={listingPagination.totalPages || 1}
                                onPageChange={setListingPage}
                            />
                        </div>
                    )}
                </>
            ) : (
                <>
                    {ticketError ? (
                        <div
                            role="alert"
                            className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700"
                        >
                            {ticketError}
                        </div>
                    ) : ticketLoading ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map((index) => (
                                <div
                                    key={index}
                                    className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white"
                                />
                            ))}
                        </div>
                    ) : sellableTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                                <Ticket className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Không có vé nào để bán lại
                            </h3>
                            <p className="mt-2 max-w-md text-sm text-slate-500">
                                Chỉ những vé đã mua, chưa check-in và sự kiện còn
                                diễn ra mới có thể đăng bán lại.
                            </p>
                            <Link
                                to="/my-tickets"
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
                            >
                                Xem vé của tôi
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sellableTickets.map((ticket) => {
                                const event = ticket.event || {};
                                const ticketType = ticket.ticketType || {};
                                const seat = ticket.seat;

                                return (
                                    <div
                                        key={ticket.id}
                                        className="group flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 flex-1 gap-4">
                                            {event.thumbnailUrl ? (
                                                <img
                                                    src={event.thumbnailUrl}
                                                    alt={
                                                        event.name || "Sự kiện"
                                                    }
                                                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
                                                    <Ticket className="h-8 w-8" />
                                                </div>
                                            )}

                                            <div className="min-w-0 space-y-1">
                                                <p className="truncate text-sm font-bold text-gray-900">
                                                    {event.name || "Sự kiện"}
                                                </p>
                                                <p className="text-xs font-semibold text-gray-600">
                                                    {ticketType.name || "Vé điện tử"}
                                                    {seat
                                                        ? ` · Ghế ${seat.rowLabel}${seat.seatNumber}`
                                                        : ""}
                                                </p>
                                                {ticketType.session?.startAt && (
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(
                                                            ticketType.session.startAt
                                                        ).toLocaleString("vi-VN")}
                                                    </p>
                                                )}
                                                <p className="font-mono text-[11px] text-gray-400">
                                                    {ticket.ticketCode}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                                            <div className="text-right">
                                                <p className="text-[11px] font-medium text-gray-400">
                                                    Giá gốc
                                                </p>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {formatResalePrice(
                                                        ticketType.price
                                                    )}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedTicket(ticket)
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Đăng bán
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {ticketPagination &&
                                ticketPagination.totalPages > 1 && (
                                    <div className="pt-4">
                                        <Pagination
                                            page={
                                                ticketPagination.currentPage || 1
                                            }
                                            totalPages={
                                                ticketPagination.totalPages || 1
                                            }
                                            onPageChange={setTicketPage}
                                        />
                                    </div>
                                )}
                        </div>
                    )}
                </>
            )}

            {/* Modal đăng bán */}
            {selectedTicket && (
                <ResaleForm
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onSuccess={handleCreateSuccess}
                    onError={(message) => handleAlert("error", message)}
                />
            )}

            {/* Modal hủy tin bán */}
            <ConfirmModal
                isOpen={Boolean(cancelTarget)}
                onClose={() => setCancelTarget(null)}
                onConfirm={handleCancel}
                title="Hủy tin bán vé"
                message="Bạn có chắc muốn hủy tin bán vé này?"
                description="Vé sẽ được trả lại tài khoản của bạn và có thể đăng bán lại sau."
                variant="danger"
                confirmText="Hủy tin bán"
                loading={cancelling}
            />
        </div>
    );
}
