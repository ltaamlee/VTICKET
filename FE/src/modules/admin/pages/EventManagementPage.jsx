import { useCallback, useEffect, useState } from "react";
import { XCircle } from "lucide-react";

import {
    getEventStats,
    getEvents,
    approveEvent,
    rejectEvent,
    suspendEvent,
    restoreEvent,
    cancelEvent,
} from "../services/eventService";

import EventStats from "../events/EventStats";
import EventToolbar from "../events/EventToolbar";
import EventTable from "../events/EventTable";
import ConfirmModal from "../../../components/common/ConfirmModal";
import FormPanel, {
    FORM_PANEL_INPUT_CLASS,
    FORM_PANEL_LABEL_CLASS,
} from "../../../components/common/form/FormPanel";
import Pagination from "../../../components/common/Pagination";

const confirmConfig = {
    approve: {
        title: "Duyệt sự kiện",
        message: "Bạn có chắc chắn muốn duyệt sự kiện này?",
        description: "Sự kiện sẽ được duyệt và hiển thị trên hệ thống.",
        variant: "success",
        confirmText: "Duyệt sự kiện",
        color: "green-600",
    },
    suspend: {
        title: "Khóa sự kiện",
        message: "Bạn có chắc chắn muốn khóa sự kiện này?",
        description: "Sự kiện sẽ tạm thời không được hiển thị cho người dùng.",
        variant: "danger",
        confirmText: "Khóa sự kiện",
    },
    restore: {
        title: "Mở khóa sự kiện",
        message: "Bạn có chắc chắn muốn mở khóa sự kiện này?",
        description: "Sự kiện sẽ được khôi phục và hiển thị lại trên hệ thống.",
        variant: "success",
        confirmText: "Mở khóa",
    },
    cancel: {
        title: "Hủy sự kiện",
        message: "Bạn có chắc chắn muốn hủy sự kiện này?",
        description: "Thao tác này sẽ thay đổi trạng thái của sự kiện.",
        variant: "warning",
        confirmText: "Hủy sự kiện",
    },
};

function AdminEventPage() {
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

    // Load statistics
    const loadStats = useCallback(async () => {
        try {
            const response = await getEventStats();
            setStats(response.data);
        } catch (error) {
            console.error("Get event stats error:", error);
        }
    }, []);

    // Load events
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
            setError(error.message || "Không thể tải danh sách sự kiện");
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

    // Refresh data
    const refreshData = () => {
        setRefreshKey((prev) => prev + 1);
    };

    // Filter events
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

    // Open action modal
    const openModal = (type, event) => {
        setSelectedEvent(event);
        setModalType(type);
        setRejectReason("");
    };

    // Close modal
    const closeModal = () => {
        if (processing) return;

        setSelectedEvent(null);
        setModalType("");
        setRejectReason("");
    };

    // Handle event actions
    const handleAction = async () => {
        if (!selectedEvent || processing) return;

        if (modalType === "reject" && !rejectReason.trim()) {
            alert("Vui lòng nhập lý do từ chối");
            return;
        }

        setProcessing(true);

        try {
            const eventId = selectedEvent.id;

            switch (modalType) {
                case "approve":
                    await approveEvent(eventId);
                    break;

                case "reject":
                    await rejectEvent(eventId, rejectReason.trim());
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

            setSelectedEvent(null);
            setModalType("");
            setRejectReason("");

            refreshData();
        } catch (error) {
            alert(error.message || "Thao tác thất bại");
        } finally {
            setProcessing(false);
        }
    };

    const currentConfirm = confirmConfig[modalType];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Quản lý sự kiện
                </h1>
            </div>

            {/* Statistics */}
            <EventStats stats={stats} />

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <EventToolbar
                    keyword={keyword}
                    status={status}
                    onKeywordChange={handleKeywordChange}
                    onStatusChange={handleStatusChange}
                    onReset={handleReset}
                />

                {error && (
                    <p className="px-5 py-4 text-sm text-red-600">{error}</p>
                )}

                <EventTable
                    events={events}
                    loading={loading}
                    currentPage={page}
                    pageSize={10}
                    onApprove={(event) => openModal("approve", event)}
                    onReject={(event) => openModal("reject", event)}
                    onSuspend={(event) => openModal("suspend", event)}
                    onRestore={(event) => openModal("restore", event)}
                    onCancel={(event) => openModal("cancel", event)}
                />

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={(newPage) => setPage(newPage)}
                />
            </div>

            {/* Reject modal */}
            {modalType === "reject" && selectedEvent && (
                <FormPanel
                    icon={XCircle}
                    title="Từ chối sự kiện"
                    subtitle={selectedEvent.name}
                    onClose={closeModal}
                    onSubmit={handleAction}
                    loading={processing}
                    size="sm"
                    submitText="Từ chối"
                    submitVariant="danger"
                >
                    <div>
                        <label className={FORM_PANEL_LABEL_CLASS}>
                            Lý do từ chối
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            placeholder="Nhập lý do từ chối..."
                            className={`${FORM_PANEL_INPUT_CLASS} resize-none`}
                        />
                    </div>
                </FormPanel>
            )}

            {/* Confirmation modal */}
            {currentConfirm && selectedEvent && (
                <ConfirmModal
                    isOpen={true}
                    onClose={closeModal}
                    onConfirm={handleAction}
                    title={currentConfirm.title}
                    message={currentConfirm.message}
                    description={
                        <>
                            {currentConfirm.description}
                            <span className="mt-2 block font-medium text-gray-700">
                                Sự kiện: {selectedEvent.name}
                            </span>
                        </>
                    }
                    variant="success"
                    confirmText={currentConfirm.confirmText}
                    loading={processing}
                />
            )}
        </div>
    );
}

export default AdminEventPage;