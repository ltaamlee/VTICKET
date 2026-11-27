import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Ticket, CheckCircle, XCircle } from "lucide-react";

import Pagination from "../../../components/common/Pagination";
import { Alert } from "../../../components/common/Arlet";
import MyTicketCard from "../../resale/components/MyTicketCard";
import ResaleForm from "../../resale/components/ResaleForm";
import { listMyOwnedTickets } from "../../resale/services/resaleService";

const FILTERS = [
    { key: "all", label: "Tất cả" },
    { key: "resellable", label: "Có thể bán lại" },
    { key: "onResale", label: "Đang bán lại" },
    { key: "used", label: "Đã check-in" },
];

export default function MyTicketsPage() {
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        let cancelled = false;

        setLoading(true);

        listMyOwnedTickets({ page })
            .then((res) => {
                if (!cancelled) {
                    setData(res.data);
                    setError("");
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err.message || "Không thể tải danh sách vé");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [page, reloadKey]);

    const tickets = data?.tickets || [];

    const filteredTickets = useMemo(() => {
        switch (filter) {
            case "resellable":
                return tickets.filter((t) => t.canResell);
            case "onResale":
                return tickets.filter((t) => t.isOnResale);
            case "used":
                return tickets.filter(
                    (t) => t.status === "CHECKED_IN" || t.checkInAt
                );
            default:
                return tickets;
        }
    }, [tickets, filter]);

    const handleResellSuccess = (message) => {
        const ticketId = selectedTicket?.id;
        setSelectedTicket(null);
        setAlert({
            variant: "success",
            title: "Thành công",
            message,
            icon: CheckCircle,
        });

        // Cập nhật tại chỗ để vé chuyển sang trạng thái "đang bán lại"
        setData((prev) =>
            prev
                ? {
                    ...prev,
                    tickets: prev.tickets.map((t) =>
                        t.id === ticketId
                            ? {
                                ...t,
                                canResell: false,
                                isOnResale: true,
                                resale: {
                                    ...(t.resale || {}),
                                    id: t.resale?.id,
                                    status: "AVAILABLE",
                                },
                            }
                            : t
                    ),
                }
                : prev
        );

        setReloadKey((key) => key + 1);
    };

    return (
        <div className="space-y-6">
            {alert && (
                <div className="fixed right-5 top-5 z-50 w-full max-w-sm">
                    <Alert
                        variant={alert.variant}
                        title={alert.title}
                        icon={alert.icon}
                        duration={3000}
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
                    Vé của tôi
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Quản lý các vé đã mua và đăng bán lại khi không tham dự.
                </p>
            </div>

            {/* Bộ lọc */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                {FILTERS.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setFilter(item.key)}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                            filter === item.key
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {error && (
                <div
                    role="alert"
                    className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                >
                    {error}
                </div>
            )}

            {/* Nội dung */}
            {loading && !data ? (
                <div className="space-y-4">
                    {[0, 1, 2].map((index) => (
                        <div
                            key={index}
                            className="h-44 animate-pulse rounded-xl border border-gray-200 bg-white"
                        />
                    ))}
                </div>
            ) : filteredTickets.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Ticket className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-gray-900">
                        {filter === "all"
                            ? "Chưa có vé nào"
                            : "Không có vé nào ở trạng thái này"}
                    </h3>
                    <p className="mt-1.5 text-sm text-gray-500">
                        {filter === "all" ? (
                            <>
                                Hãy khám phá các sự kiện đang mở bán và đặt vé
                                ngay.
                            </>
                        ) : (
                            "Thử chuyển sang bộ lọc khác để xem thêm vé của bạn."
                        )}
                    </p>
                    {filter === "all" && (
                        <Link
                            to="/events"
                            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                            Khám phá sự kiện
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTickets.map((ticket) => (
                        <MyTicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onResell={setSelectedTicket}
                        />
                    ))}
                </div>
            )}

            {data && data.pagination?.totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        page={data.pagination.currentPage || 1}
                        totalPages={data.pagination.totalPages || 1}
                        onPageChange={setPage}
                    />
                </div>
            )}

            {/* Modal đăng bán */}
            {selectedTicket && (
                <ResaleForm
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onSuccess={handleResellSuccess}
                    onError={(message) =>
                        setAlert({
                            variant: "error",
                            title: "Thất bại",
                            message,
                            icon: XCircle,
                        })
                    }
                />
            )}
        </div>
    );
}
