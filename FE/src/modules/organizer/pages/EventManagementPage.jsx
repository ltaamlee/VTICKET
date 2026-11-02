import { useState, useEffect } from "react";
import { Plus, CheckCircle, XCircle } from "lucide-react";

import { getEvents } from "../services/eventService";

import EventToolbar from "../components/events/EventToolbar";
import EventTable from "../components/events/EventTable";
import EventCreateModal from "../components/events/modals/EventCreateModal";
import { getCategories } from "../services/categoryService";

import Pagination from "../../../components/common/Pagination";
import { Alert } from "../../../components/common/Arlet";
import Button from "../../../components/common/button/Button";

function OrganizerEventPage() {
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

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const result = await getCategories();
                const data = result?.data;

                if (Array.isArray(data)) {
                    setCategories(data);
                } else if (Array.isArray(data?.categories)) {
                    setCategories(data.categories);
                } else {
                    setCategories([]);
                    console.error("Response không đúng cấu trúc:", result);
                }
            } catch (error) {
                handleAlert(
                    "error",
                    error.response?.data?.message ||
                    error.message ||
                    "Không thể tải danh sách danh mục."
                );
            }
        };

        fetchCategories();
    }, []);

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const handleKeywordChange = (value) => {
        setKeyword(value);
        setPage(1);
    };

    const handleStatusChange = (value) => {
        setStatus(value);
        setPage(1);
    };

    const handleReset = () => {
        setKeyword("");
        setStatus("");
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        if (
            newPage >= 1 &&
            newPage <= totalPages &&
            newPage !== page
        ) {
            setPage(newPage);
        }
    };

    const handleAlert = (type, message) => {
        setAlert({
            variant: type === "success" ? "success" : "error",
            title: type === "success" ? "Thành công" : "Thất bại",
            message,
            icon: type === "success" ? CheckCircle : XCircle,
        });
    };

    useEffect(() => {
        let cancelled = false;

        async function fetchEvents() {
            setLoading(true);
            setError("");

            try {
                const result = await getEvents({
                    page,
                    keyword,
                    status,
                });

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
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchEvents();

        return () => {
            cancelled = true;
        };
    }, [page, keyword, status, refreshKey]);

    const handleCreateSuccess = (message) => {
        setShowCreateModal(false);
        handleRefresh();
        handleAlert("success", message);
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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý sự kiện
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý các sự kiện do bạn tổ chức trên VTICKET.
                    </p>
                </div>

                <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={18} />
                    Tạo sự kiện
                </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
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
                    loading={loading}
                    currentPage={page}
                    pageSize={10}
                    onRefresh={handleRefresh}
                    onAlert={handleAlert}
                />

                {!loading && !error && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        onAlert={handleAlert}
                    />
                )}
            </div>

            {showCreateModal && (
                <EventCreateModal
                    categories={categories}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                    onAlert={handleAlert}
                />
            )}
        </div>
    );
}

export default OrganizerEventPage;