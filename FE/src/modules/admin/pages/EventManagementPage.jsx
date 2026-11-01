import { useCallback, useEffect, useState } from "react";
import {
    getEventStats,
    getEvents,
    getEventDetail,
    approveEvent,
    rejectEvent,
    suspendEvent,
    restoreEvent,
    cancelEvent,
} from "../services/eventService";

import EventStats from "../components/events/EventStats";
import EventToolbar from "../components/events/EventToolbar";
import EventTable from "../components/events/EventTable";

function EventPage() {
    const [stats, setStats] = useState({});
    const [events, setEvents] = useState([]);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalType, setModalType] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [processing, setProcessing] = useState(false);

    const [refreshKey, setRefreshKey] = useState(0);

    const loadStats = useCallback(async () => {
        try {
            const response = await getEventStats();
            setStats(response.data);
        } catch (error) {
            console.error("Get event stats error:", error);
        }
    }, []);

    const loadEvents = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getEvents({
                page,
                keyword,
                status,
            });

            setEvents(response.data.events || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (error) {
            setError(
                error.message || "Không thể tải danh sách sự kiện"
            );
        } finally {
            setLoading(false);
        }
    }, [page, keyword, status]);

    useEffect(() => {
        loadStats();
    }, [loadStats, refreshKey]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents, refreshKey]);

    const refreshData = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const handleReset = () => {
        setKeyword("");
        setStatus("");
        setPage(1);
    };

    const handleKeywordChange = (value) => {
        setKeyword(value);
        setPage(1);
    };

    const handleStatusChange = (value) => {
        setStatus(value);
        setPage(1);
    };

    const openModal = (type, event) => {
        setSelectedEvent(event);
        setModalType(type);
        setRejectReason("");
    };

    const closeModal = () => {
        setSelectedEvent(null);
        setModalType("");
        setRejectReason("");
    };

    const handleView = async (event) => {
        try {
            const response = await getEventDetail(event.id);
            setSelectedEvent(response.data);
            setModalType("detail");
        } catch (error) {
            alert(error.message || "Không thể tải chi tiết sự kiện");
        }
    };

    const handleAction = async () => {
        if (!selectedEvent || processing) return;

        setProcessing(true);

        try {
            const eventId = selectedEvent.id;

            switch (modalType) {
                case "approve":
                    await approveEvent(eventId);
                    break;

                case "reject":
                    if (!rejectReason.trim()) {
                        alert("Vui lòng nhập lý do từ chối");
                        setProcessing(false);
                        return;
                    }

                    await rejectEvent(eventId, rejectReason);
                    break;

                case "suspend":
                    await suspendEvent(eventId);
                    break;

                case "restore":
                    await restoreEvent(eventId);
                    break;

                case "cancel":
                    await cancelEvent(eventId);
                    break;

                default:
                    return;
            }

            closeModal();
            refreshData();
        } catch (error) {
            alert(error.message || "Thao tác thất bại");
        } finally {
            setProcessing(false);
        }
    };

    const confirmMessages = {
        approve: "Bạn có chắc chắn muốn duyệt sự kiện này?",
        suspend: "Bạn có chắc chắn muốn khóa sự kiện này?",
        restore: "Bạn có chắc chắn muốn mở khóa sự kiện này?",
        cancel: "Bạn có chắc chắn muốn hủy sự kiện này?",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Quản lý sự kiện
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Theo dõi, kiểm duyệt và quản lý các sự kiện trên hệ thống.
                </p>
            </div>

            <EventStats stats={stats} />

            <EventToolbar
                keyword={keyword}
                status={status}
                onKeywordChange={handleKeywordChange}
                onStatusChange={handleStatusChange}
                onReset={handleReset}
            />

            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    {error}
                </div>
            )}

            <EventTable
                events={events}
                loading={loading}
                onView={handleView}
                onApprove={(event) => openModal("approve", event)}
                onReject={(event) => openModal("reject", event)}
                onSuspend={(event) => openModal("suspend", event)}
                onRestore={(event) => openModal("restore", event)}
                onCancel={(event) => openModal("cancel", event)}
            />

            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    Trang {page} / {totalPages}
                </p>

                <div className="flex gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((prev) => prev - 1)}
                        className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
                    >
                        Trước
                    </button>

                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((prev) => prev + 1)}
                        className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
                    >
                        Tiếp
                    </button>
                </div>
            </div>

            {/* Detail modal */}
            {modalType === "detail" && selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Chi tiết sự kiện
                            </h2>

                            <button onClick={closeModal}>✕</button>
                        </div>

                        {selectedEvent.bannerUrl && (
                            <img
                                src={selectedEvent.bannerUrl}
                                alt=""
                                className="mb-5 h-56 w-full rounded-lg object-cover"
                            />
                        )}

                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-500">Tên sự kiện</p>
                                <p className="font-medium">
                                    {selectedEvent.name}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Địa điểm</p>
                                <p>{selectedEvent.location}</p>
                            </div>

                            <div>
                                <p className="text-gray-500">Danh mục</p>
                                <p>{selectedEvent.category?.name || "—"}</p>
                            </div>

                            <div>
                                <p className="text-gray-500">Ban tổ chức</p>
                                <p>
                                    {selectedEvent.organizer?.organizerProfile
                                        ?.organizationName ||
                                        selectedEvent.organizer?.profile
                                            ?.fullName ||
                                        selectedEvent.organizer?.username ||
                                        "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Mô tả</p>
                                <p className="whitespace-pre-line">
                                    {selectedEvent.description || "Chưa có mô tả"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Lý do từ chối</p>
                                <p>{selectedEvent.rejectReason || "—"}</p>
                            </div>

                            <div>
                                <p className="text-gray-500">Số phiên sự kiện</p>
                                <p>{selectedEvent.eventSessions?.length || 0}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={closeModal}
                                className="rounded-lg bg-gray-100 px-5 py-2 text-sm hover:bg-gray-200"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation / rejection modal */}
            {["approve", "reject", "suspend", "restore", "cancel"].includes(
                modalType
            ) && selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6">
                        <h2 className="text-lg font-semibold">
                            {modalType === "reject"
                                ? "Từ chối sự kiện"
                                : "Xác nhận thao tác"}
                        </h2>

                        <p className="mt-3 text-sm text-gray-600">
                            Sự kiện:{" "}
                            <span className="font-medium text-gray-900">
                                {selectedEvent.name}
                            </span>
                        </p>

                        {modalType === "reject" ? (
                            <textarea
                                value={rejectReason}
                                onChange={(e) =>
                                    setRejectReason(e.target.value)
                                }
                                rows={4}
                                placeholder="Nhập lý do từ chối..."
                                className="mt-4 w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-blue-500"
                            />
                        ) : (
                            <p className="mt-3 text-sm text-gray-600">
                                {confirmMessages[modalType]}
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                disabled={processing}
                                className="rounded-lg border px-4 py-2 text-sm"
                            >
                                Hủy
                            </button>

                            <button
                                onClick={handleAction}
                                disabled={processing}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? "Đang xử lý..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventPage;