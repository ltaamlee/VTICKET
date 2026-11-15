import { useCallback, useEffect, useState } from "react";
import {
    Check,
    CircleAlert,
    LoaderCircle,
    Search,
    Ticket,
    X,
} from "lucide-react";

import Pagination from "../../../components/common/Pagination";
import StatCard from "../../../components/common/stats/StatCard";
import { getEvents } from "../services/eventService";
import {
    checkInTicket,
    getEventTickets,
    getEventTicketStats,
    getTicketDetail,
} from "../services/ticketService";

const TICKET_PAGE_SIZE = 20;

const ticketStatuses = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "ISSUED", label: "Đã phát hành" },
    { value: "CHECKED_IN", label: "Đã check-in" },
    { value: "RESERVED", label: "Đang giữ chỗ" },
    { value: "CANCELLED", label: "Đã hủy" },
    { value: "REFUNDED", label: "Đã hoàn tiền" },
    { value: "EXPIRED", label: "Đã hết hạn" },
    { value: "AVAILABLE", label: "Chưa phát hành" },
];

const statusStyles = {
    ISSUED: "bg-emerald-50 text-emerald-700",
    CHECKED_IN: "bg-indigo-50 text-indigo-700",
    RESERVED: "bg-amber-50 text-amber-700",
    CANCELLED: "bg-rose-50 text-rose-700",
    REFUNDED: "bg-slate-100 text-slate-600",
    EXPIRED: "bg-slate-100 text-slate-600",
    AVAILABLE: "bg-slate-100 text-slate-600",
};

const statusLabels = Object.fromEntries(
    ticketStatuses.filter((status) => status.value).map((status) => [
        status.value,
        status.label,
    ])
);

const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

function getTicketOwner(ticket) {
    return (
        ticket?.user?.profile?.fullName ||
        ticket?.user?.email ||
        "Khách hàng"
    );
}

function TicketManagementPage() {
    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState("");
    const [eventsLoading, setEventsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [selectedTicketId, setSelectedTicketId] = useState("");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [processingTicketId, setProcessingTicketId] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function loadEvents() {
            setEventsLoading(true);
            try {
                const firstResponse = await getEvents({ page: 1 });
                const firstData = firstResponse.data;
                const firstEvents = firstData?.events;
                if (!Array.isArray(firstEvents)) {
                    throw new Error("Dữ liệu sự kiện trả về không hợp lệ.");
                }

                const totalEventPages = Math.max(
                    1,
                    Number(firstData?.pagination?.totalPages) || 1
                );
                const remainingPages = await Promise.all(
                    Array.from({ length: totalEventPages - 1 }, (_, index) =>
                        getEvents({ page: index + 2 })
                    )
                );
                const allEvents = [
                    ...firstEvents,
                    ...remainingPages.flatMap((response) => {
                        const pageEvents = response.data?.events;
                        if (!Array.isArray(pageEvents)) {
                            throw new Error("Dữ liệu sự kiện trả về không hợp lệ.");
                        }
                        return pageEvents;
                    }),
                ];

                if (!cancelled) {
                    setEvents(allEvents);
                    setEventId((current) => current || allEvents[0]?.id || "");
                }
            } catch (requestError) {
                if (!cancelled) {
                    setError(
                        requestError.message || "Không thể tải danh sách sự kiện."
                    );
                }
            } finally {
                if (!cancelled) setEventsLoading(false);
            }
        }

        loadEvents();
        return () => {
            cancelled = true;
        };
    }, []);

    const loadTickets = useCallback(async () => {
        if (!eventId) {
            return null;
        }

        const [ticketResponse, statsResponse] = await Promise.all([
            getEventTickets(eventId, {
                page,
                pageSize: TICKET_PAGE_SIZE,
                keyword,
                status,
            }),
            getEventTicketStats(eventId),
        ]);
        return {
            tickets: ticketResponse.data?.tickets || [],
            totalPages: ticketResponse.data?.pagination?.totalPages || 1,
            stats: statsResponse.data,
        };
    }, [eventId, page, keyword, status]);

    useEffect(() => {
        let cancelled = false;

        loadTickets()
            .then((result) => {
                if (cancelled || !result) return;
                setError("");
                setTickets(result.tickets);
                setTotalPages(result.totalPages);
                setStats(result.stats);
            })
            .catch((requestError) => {
                if (cancelled) return;
                setError(
                    requestError.message || "Không thể tải danh sách vé."
                );
                setTickets([]);
                setStats(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [loadTickets, refreshKey]);

    useEffect(() => {
        if (!selectedTicketId) {
            return undefined;
        }

        let cancelled = false;
        getTicketDetail(selectedTicketId)
            .then((response) => {
                if (!cancelled) setSelectedTicket(response.data);
            })
            .catch((requestError) => {
                if (!cancelled) {
                    setActionError(
                        requestError.message || "Không thể tải thông tin vé."
                    );
                    setSelectedTicketId("");
                }
            })
            .finally(() => {
                if (!cancelled) setDetailLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedTicketId, refreshKey]);

    const handleSearch = (event) => {
        event.preventDefault();
        const nextKeyword = keywordInput.trim();
        if (nextKeyword === keyword && page === 1) return;

        setLoading(true);
        setPage(1);
        setKeyword(nextKeyword);
    };

    const handleEventChange = (nextEventId) => {
        setLoading(true);
        setEventId(nextEventId);
        setPage(1);
        setSelectedTicketId("");
        setActionError("");
        setError("");
    };

    const openTicketDetails = (ticketId) => {
        setSelectedTicket(null);
        setDetailLoading(true);
        setSelectedTicketId(ticketId);
    };

    const handleCheckIn = async (ticketId) => {
        setProcessingTicketId(ticketId);
        setActionError("");
        try {
            await checkInTicket(ticketId);
            setLoading(true);
            setRefreshKey((current) => current + 1);
        } catch (requestError) {
            setActionError(
                requestError.message || "Không thể check-in vé."
            );
        } finally {
            setProcessingTicketId("");
        }
    };

    const selectedEvent = events.find((event) => event.id === eventId);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Quản lý vé
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Tra cứu thông tin vé và check-in khách tham dự.
                    </p>
                </div>
                <label className="w-full sm:max-w-sm">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                        Sự kiện
                    </span>
                    <select
                        value={eventId}
                        onChange={(event) => handleEventChange(event.target.value)}
                        disabled={eventsLoading || !events.length}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                    >
                        {events.length ? (
                            events.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {event.name}
                                </option>
                            ))
                        ) : (
                            <option value="">
                                {eventsLoading
                                    ? "Đang tải sự kiện..."
                                    : "Chưa có sự kiện"}
                            </option>
                        )}
                    </select>
                </label>
            </div>

            {error && !eventId && (
                <div
                    role="alert"
                    className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                >
                    <CircleAlert className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {actionError && (
                <div
                    role="alert"
                    className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                    <span className="flex items-center gap-2">
                        <CircleAlert className="h-4 w-4 shrink-0" />
                        {actionError}
                    </span>
                    <button
                        type="button"
                        aria-label="Đóng thông báo"
                        onClick={() => setActionError("")}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {eventId && (
                <>
                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Tổng sức chứa"
                            value={stats?.total ?? 0}
                            icon={Ticket}
                            bg="bg-sky-50"
                            iconBg="bg-sky-500"
                            loading={loading}
                        />
                        <StatCard
                            label="Còn có thể bán"
                            value={stats?.available ?? 0}
                            icon={Ticket}
                            bg="bg-blue-50"
                            iconBg="bg-blue-500"
                            loading={loading}
                        />
                        <StatCard
                            label="Đã bán"
                            value={stats?.sold ?? 0}
                            icon={Check}
                            bg="bg-emerald-50"
                            iconBg="bg-emerald-500"
                            loading={loading}
                        />
                        <StatCard
                            label="Đã check-in"
                            value={stats?.checkedIn ?? 0}
                            icon={Check}
                            bg="bg-indigo-50"
                            iconBg="bg-indigo-500"
                            loading={loading}
                        />
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                                <h2 className="truncate font-semibold text-slate-900">
                                    {selectedEvent?.name || "Danh sách vé"}
                                </h2>
                                {selectedEvent?.startAt && (
                                    <p className="mt-1 text-xs text-slate-500">
                                        {new Date(selectedEvent.startAt).toLocaleDateString(
                                            "vi-VN"
                                        )}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <form
                                    onSubmit={handleSearch}
                                    className="flex min-w-0 gap-2"
                                >
                                    <div className="relative min-w-0 flex-1 sm:w-64">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={keywordInput}
                                            onChange={(event) =>
                                                setKeywordInput(event.target.value)
                                            }
                                            placeholder="Tìm mã vé..."
                                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                    >
                                        Tìm
                                    </button>
                                </form>
                                <select
                                    value={status}
                                    onChange={(event) => {
                                        setLoading(true);
                                        setStatus(event.target.value);
                                        setPage(1);
                                    }}
                                    aria-label="Lọc theo trạng thái vé"
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
                                >
                                    {ticketStatuses.map((ticketStatus) => (
                                        <option
                                            key={ticketStatus.value || "all"}
                                            value={ticketStatus.value}
                                        >
                                            {ticketStatus.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="m-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
                            >
                                <CircleAlert className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">STT</th>
                                        <th className="px-5 py-3 font-semibold">Mã vé</th>
                                        <th className="px-5 py-3 font-semibold">Khách hàng</th>
                                        <th className="px-5 py-3 font-semibold">Loại vé</th>
                                        <th className="px-5 py-3 font-semibold">Trạng thái</th>
                                        <th className="px-5 py-3 font-semibold">Chỗ ngồi</th>
                                        <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-12 text-center text-slate-500"
                                            >
                                                <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                                                <span className="mt-2 block">Đang tải vé...</span>
                                            </td>
                                        </tr>
                                    ) : tickets.length ? (
                                        tickets.map((ticket, index) => (
                                            <tr
                                                key={ticket.id}
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4 text-slate-500">
                                                    {(page - 1) *
                                                        TICKET_PAGE_SIZE +
                                                        index +
                                                        1}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openTicketDetails(ticket.id)
                                                        }
                                                        className="font-semibold text-indigo-700 hover:underline"
                                                    >
                                                        {ticket.ticketCode}
                                                    </button>
                                                </td>
                                                <td className="px-5 py-4 text-slate-700">
                                                    {getTicketOwner(ticket)}
                                                </td>
                                                <td className="px-5 py-4 text-slate-700">
                                                    {ticket.ticketType?.name || "—"}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            statusStyles[ticket.status] ||
                                                            "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        {statusLabels[ticket.status] ||
                                                            ticket.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-slate-600">
                                                    {ticket.seat
                                                        ? `${ticket.seat.zone?.name || ""} ${ticket.seat.rowLabel || ""}${ticket.seat.seatNumber || ""}`.trim()
                                                        : "Không chọn ghế"}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {ticket.status === "ISSUED" ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCheckIn(ticket.id)
                                                            }
                                                            disabled={
                                                                processingTicketId ===
                                                                ticket.id
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                                        >
                                                            {processingTicketId ===
                                                            ticket.id ? (
                                                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Check className="h-3.5 w-3.5" />
                                                            )}
                                                            Check-in
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openTicketDetails(ticket.id)
                                                            }
                                                            className="rounded-lg px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                                                        >
                                                            Chi tiết
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-14 text-center"
                                            >
                                                <Ticket className="mx-auto h-8 w-8 text-slate-300" />
                                                <p className="mt-2 text-sm font-medium text-slate-700">
                                                    Không tìm thấy vé
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Thử thay đổi từ khóa hoặc bộ lọc.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={(nextPage) => {
                                setLoading(true);
                                setPage(nextPage);
                            }}
                        />
                    </section>
                </>
            )}

            {!eventsLoading && !events.length && !error && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <Ticket className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-800">
                        Chưa có sự kiện để quản lý vé
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        Tạo sự kiện trước để xem danh sách vé.
                    </p>
                </div>
            )}

            {selectedTicketId && (
                <>
                    <button
                        type="button"
                        aria-label="Đóng chi tiết vé"
                        onClick={() => setSelectedTicketId("")}
                        className="ticket-detail-backdrop fixed inset-0 z-40 bg-slate-950/30"
                    />
                    <aside
                        aria-label="Chi tiết vé"
                        className="ticket-detail-panel fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                    >
                        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Chi tiết vé
                                </p>
                                <h2 className="mt-1 font-semibold text-slate-900">
                                    {selectedTicket?.ticketCode || "Đang tải..."}
                                </h2>
                            </div>
                            <button
                                type="button"
                                aria-label="Đóng panel"
                                onClick={() => setSelectedTicketId("")}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>
                        <div className="flex-1 space-y-5 overflow-y-auto p-5">
                            {detailLoading ? (
                                <div className="flex justify-center py-12">
                                    <LoaderCircle className="h-6 w-6 animate-spin text-indigo-600" />
                                </div>
                            ) : selectedTicket ? (
                                <>
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">Sự kiện</p>
                                        <p className="mt-1 font-semibold text-slate-900">
                                            {selectedTicket.event?.name}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {selectedTicket.event?.location}
                                        </p>
                                        {selectedTicket.event?.startAt && (
                                            <p className="mt-1 text-sm text-slate-600">
                                                {new Date(
                                                    selectedTicket.event.startAt
                                                ).toLocaleString("vi-VN")}
                                            </p>
                                        )}
                                    </div>
                                    <dl className="space-y-4">
                                        <div>
                                            <dt className="text-xs text-slate-500">
                                                Khách hàng
                                            </dt>
                                            <dd className="mt-1 text-sm font-medium text-slate-800">
                                                {getTicketOwner(selectedTicket)}
                                            </dd>
                                            {selectedTicket.user?.profile?.phone && (
                                                <dd className="mt-1 text-sm text-slate-600">
                                                    {selectedTicket.user.profile.phone}
                                                </dd>
                                            )}
                                        </div>
                                        <div>
                                            <dt className="text-xs text-slate-500">
                                                Loại vé
                                            </dt>
                                            <dd className="mt-1 text-sm font-medium text-slate-800">
                                                {selectedTicket.ticketType?.name} ·{" "}
                                                {currency.format(
                                                    selectedTicket.ticketType?.price || 0
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-slate-500">
                                                Trạng thái
                                            </dt>
                                            <dd className="mt-1 text-sm font-medium text-slate-800">
                                                {statusLabels[selectedTicket.status] ||
                                                    selectedTicket.status}
                                            </dd>
                                        </div>
                                        {selectedTicket.checkInAt && (
                                            <div>
                                                <dt className="text-xs text-slate-500">
                                                    Thời gian check-in
                                                </dt>
                                                <dd className="mt-1 text-sm text-slate-800">
                                                    {new Date(
                                                        selectedTicket.checkInAt
                                                    ).toLocaleString("vi-VN")}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </>
                            ) : null}
                        </div>
                        {selectedTicket?.status === "ISSUED" && (
                            <footer className="border-t border-slate-200 p-5">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCheckIn(selectedTicket.id)
                                    }
                                    disabled={
                                        processingTicketId === selectedTicket.id
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    {processingTicketId === selectedTicket.id ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    Check-in vé
                                </button>
                            </footer>
                        )}
                    </aside>
                </>
            )}
        </div>
    );
}

export default TicketManagementPage;
