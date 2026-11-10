import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, CheckCircle, XCircle, Armchair, CalendarDays } from "lucide-react";

import { getEvents, getEventStats } from "../services/eventService";
import { getCategories } from "../services/categoryService";
import useSeatMaps from "../seatmaps/editor/hooks/useSeatMaps";
import { subscribeToSeatMapChanges } from "../seatmaps/seatMapSync";

import EventToolbar from "../events/EventToolbar";
import EventTable from "../events/EventTable";
import OrganizerEventStats from "../events/OrganizerEventStats";
import EventFormModal from "../events/modals/EventFormModal";
import SeatMapTable from "../seatmaps/editor/components/SeatMapTable";

import Pagination from "../../../components/common/Pagination";
import { Alert } from "../../../components/common/Arlet";
import ConfirmModal from "../../../components/common/ConfirmModal";
import Button from "../../../components/common/button/Button";
import Tabs from "../../../components/common/Tabs";

const TAB_EVENTS = "events";
const TAB_SEAT_MAPS = "seat-maps";

function OrganizerEventPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("");
    const [events, setEvents] = useState([]);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const [alert, setAlert] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [categories, setCategories] = useState([]);
    const [activeTab, setActiveTab] = useState(
        searchParams.get("tab") === TAB_SEAT_MAPS ? TAB_SEAT_MAPS : TAB_EVENTS
    );

    // Thống kê sự kiện của BTC.
    const [stats, setStats] = useState({});
    const [statsLoading, setStatsLoading] = useState(true);

    const [seatMapRefreshKey, setSeatMapRefreshKey] = useState(0);

    const handleAlert = useCallback((type, message) => {
        setAlert({
            variant: type === "success" ? "success" : "error",
            title: type === "success" ? "Thành công" : "Thất bại",
            message,
            icon: type === "success" ? CheckCircle : XCircle,
        });
    }, []);

    // ===== Danh mục =====
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const firstPage = await getCategories({ page: 1 });
                const firstData = firstPage?.data;
                const firstCategories = Array.isArray(firstData)
                    ? firstData
                    : firstData?.categories;

                if (!Array.isArray(firstCategories)) {
                    throw new Error("Dữ liệu danh mục trả về không hợp lệ.");
                }

                const totalPages = Math.max(
                    1,
                    Number(firstData?.pagination?.totalPages) || 1
                );
                const remainingPages = await Promise.all(
                    Array.from({ length: totalPages - 1 }, (_, index) =>
                        getCategories({ page: index + 2 })
                    )
                );

                const allCategories = [
                    ...firstCategories,
                    ...remainingPages.flatMap((result) => {
                        const data = result?.data;
                        if (Array.isArray(data)) return data;
                        if (Array.isArray(data?.categories)) {
                            return data.categories;
                        }
                        throw new Error("Dữ liệu danh mục trả về không hợp lệ.");
                    }),
                ];
                setCategories(allCategories);
            } catch (err) {
                console.error("Lỗi tải danh sách danh mục:", err);
                handleAlert(
                    "error",
                    err.response?.data?.message ||
                    err.message ||
                    "Không thể tải danh sách danh mục."
                );
            }
        };

        fetchCategories();
    }, [handleAlert]);

    // ===== Sự kiện =====
    useEffect(() => {
        let cancelled = false;

        async function fetchEvents() {
            setLoading(true);
            setError("");

            try {
                const result = await getEvents({ page, keyword, status });

                if (cancelled) return;

                setEvents(result.data?.events || []);
                setTotalPages(result.data?.pagination?.totalPages || 1);
            } catch (err) {
                if (cancelled) return;

                console.error("Lỗi tải danh sách sự kiện:", err);

                setError(
                    err.message || "Không thể tải danh sách sự kiện"
                );

                setEvents([]);
                setTotalPages(1);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchEvents();

        return () => {
            cancelled = true;
        };
    }, [page, keyword, status, refreshKey]);

    const handleSeatMapsChange = useCallback(() => {
        setSeatMapRefreshKey((v) => v + 1);
    }, []);

    // ===== Thống kê sự kiện =====
    useEffect(() => {
        let cancelled = false;

        async function fetchStats() {
            try {
                const result = await getEventStats();

                if (cancelled) return;

                setStats(result?.data || {});
            } catch (err) {
                if (cancelled) return;

                // Lỗi thống kê không chặn trang, chỉ bỏ trống số liệu.
                console.error("Lỗi tải thống kê sự kiện:", err);
            } finally {
                if (!cancelled) setStatsLoading(false);
            }
        }

        fetchStats();

        return () => {
            cancelled = true;
        };
    }, [refreshKey]);

    // ===== Sơ đồ ghế =====
    const seatMaps = useSeatMaps({
        onAlert: handleAlert,
        refreshKey,
        onChange: handleSeatMapsChange,
    });

    const refreshSeatMaps = seatMaps.refresh;
    useEffect(
        () => subscribeToSeatMapChanges(refreshSeatMaps),
        [refreshSeatMaps]
    );
    const handleRefresh = useCallback(() => {
        setRefreshKey((prev) => prev + 1);
    }, []);

    const handleKeywordChange = useCallback((value) => {
        setKeyword(value);
        setPage(1);
    }, []);

    const handleStatusChange = useCallback((value) => {
        setStatus(value);
        setPage(1);
    }, []);

    const handleReset = useCallback(() => {
        setKeyword("");
        setStatus("");
        setPage(1);
    }, []);

    const handlePageChange = useCallback(
        (newPage) => {
            if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
                setPage(newPage);
            }
        },
        [page, totalPages]
    );

    const handleCreateSuccess = useCallback(
        (message) => {
            setShowCreateModal(false);
            handleRefresh();
            handleAlert("success", message);
        },
        [handleRefresh, handleAlert]
    );


    const handleManageSeatMaps = useCallback(() => {
        window.open(
            "/organizer/events?tab=seat-maps",
            "_blank",
            "noopener,noreferrer"
        );
    }, []);

    const handleOpenSeatMapCreate = useCallback(() => {
        window.open(
            "/organizer/seat-maps/new",
            "_blank",
            "noopener,noreferrer"
        );
    }, []);

    const tabs = [
        { id: TAB_EVENTS, label: "Quản lý sự kiện", icon: CalendarDays },
        { id: TAB_SEAT_MAPS, label: "Quản lý sơ đồ ghế", icon: Armchair },
    ];

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

            {/* HEADER */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý sự kiện
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý các sự kiện do bạn tổ chức trên VTICKET.
                    </p>
                </div>

                {activeTab === TAB_EVENTS ? (
                    <Button
                        variant="primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={18} />
                        Tạo sự kiện
                    </Button>
                ) : activeTab === TAB_SEAT_MAPS ? (
                    <Button
                        variant="primary"
                        onClick={handleOpenSeatMapCreate}
                    >
                        <Plus size={18} />
                        Tạo sơ đồ ghế
                    </Button>
                ) : null}
            </div>

            <OrganizerEventStats
                stats={stats}
                loading={statsLoading}
            />
            {/* TABS */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="px-5 pt-4">
                    <Tabs
                        tabs={tabs}
                        defaultTab={TAB_EVENTS}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                    />
                </div>

                {activeTab === TAB_EVENTS ? (
                    <>
                        <EventToolbar
                            keyword={keyword}
                            setKeyword={handleKeywordChange}
                            status={status}
                            setStatus={handleStatusChange}
                            onReset={handleReset}
                        />

                        {error && (
                            <p className="px-5 py-4 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        <EventTable
                            events={events}
                            categories={categories}
                            loading={loading}
                            currentPage={page}
                            pageSize={10}
                            onRefresh={handleRefresh}
                            onAlert={handleAlert}
                            onManageSeatMaps={handleManageSeatMaps}
                            seatMapRefreshKey={seatMapRefreshKey}
                        />

                        {!loading && !error && (
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                onAlert={handleAlert}
                            />
                        )}
                    </>
                ) : activeTab === TAB_SEAT_MAPS ? (
                    <SeatMapTable
                        seatMaps={seatMaps.seatMaps}
                        loading={seatMaps.loading}
                        onEdit={(seatMap) =>
                            navigate(`/organizer/seat-maps/${seatMap.id}/edit`)
                        }
                        onDuplicate={seatMaps.handleDuplicate}
                        onDelete={seatMaps.setDeleteTarget}
                    />
                ) : null}
            </div>

            {/* MODALS */}
            {showCreateModal && (
                <EventFormModal
                    mode="create"
                    open={activeTab === TAB_EVENTS}
                    categories={categories}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                    onAlert={handleAlert}
                    onManageSeatMaps={handleManageSeatMaps}
                    seatMapRefreshKey={seatMapRefreshKey}
                />
            )}

            <ConfirmModal
                isOpen={Boolean(seatMaps.deleteTarget)}
                onClose={() => seatMaps.setDeleteTarget(null)}
                onConfirm={seatMaps.handleDelete}
                title="Xóa sơ đồ sự kiện"
                message="Bạn có chắc chắn muốn xóa sơ đồ sự kiện này?"
                description={
                    seatMaps.deleteTarget
                        ? `"${seatMaps.deleteTarget.name}" sẽ bị xóa cùng toàn bộ khu vực và ghế bên trong.`
                        : ""
                }
                variant="danger"
                confirmText="Xóa sơ đồ"
                loading={seatMaps.deleting}
            />
        </div>
    );
}

export default OrganizerEventPage;