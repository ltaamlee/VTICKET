
import { useState, useEffect } from "react";
import { Plus, CheckCircle, XCircle } from "lucide-react";

import { getCategories } from "../services/categoryService";

import CategoryToolbar from "../components/categories/CategoryToolbar";
import CategoryTable from "../components/categories/CategoryTable";
import CategoryCreateModal from "../components/categories/modals/CategoryCreateModal";

import Pagination from "../../../components/common/Pagination";
import { Alert } from "../../../components/common/Arlet";
import Button from "../../../components/common/button/Button";

function CategoryPage() {
    const [keyword, setKeyword] = useState("");
    const [categories, setCategories] = useState([]);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const [alert, setAlert] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const handleKeywordChange = (value) => {
        setKeyword(value);
        setPage(1);
    };

    const handleReset = () => {
        setKeyword("");
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

        async function fetchCategories() {
            setLoading(true);
            setError("");

            try {
                const result = await getCategories({
                    page,
                    keyword,
                });

                if (cancelled) return;

                setCategories(result.data || []);
                setTotalPages(result.pagination?.totalPages || 1);
            } catch (err) {
                if (cancelled) return;

                console.error("Lỗi tải danh sách danh mục:", err);

                setError(
                    err.message || "Không thể tải danh sách danh mục"
                );

                setCategories([]);
                setTotalPages(1);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchCategories();

        return () => {
            cancelled = true;
        };
    }, [page, keyword, refreshKey]);

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
                        Quản lý danh mục
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý các danh mục sự kiện trên VTICKET.
                    </p>
                </div>

                <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={18} />
                    Tạo danh mục
                </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <CategoryToolbar
                    keyword={keyword}
                    setKeyword={handleKeywordChange}
                    onReset={handleReset}
                    onRefresh={handleRefresh}
                    onAlert={handleAlert}
                />

                {error && (
                    <p className="px-5 py-4 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <CategoryTable
                    categories={categories}
                    loading={loading}
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
                <CategoryCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                    onAlert={handleAlert}
                />
            )}
        </div>
    );
}

export default CategoryPage;