import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../../../layout/Header";
import Footer from "../../../layout/Footer";
import EventFilterBar from "../components/list/EventFilterBar";
import EventFilterSidebar from "../components/list/EventFilterSidebar";
import ActiveFilters from "../components/list/ActiveFilters";
import EventGrid from "../components/list/EventGrid";
import EventPagination from "../components/list/EventPagination";
import EventSkeleton from "../components/common/EventSkeleton";
import { getEvents, getCategories } from "../services/eventService";

/**
 * EventListPage - Trang danh sách, tìm kiếm và lọc sự kiện công khai (/events)
 * Áp dụng Component-Driven: tách rời toàn bộ các khối chức năng thành từng component nhỏ.
 */
export default function EventListPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Dữ liệu từ API
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Trạng thái drawer filter mobile
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Đọc bộ lọc từ URL SearchParams
    const keyword = searchParams.get("keyword") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const location = searchParams.get("location") || "";
    const timeFrame = searchParams.get("timeFrame") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const isFree = searchParams.get("isFree") === "true";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const sortParam = searchParams.get("sort") || "startAt_asc";
    const currentPage = parseInt(searchParams.get("page") || "1", 10);

    // Tách sortBy và sortOrder từ sortParam (vd: startAt_asc -> sortBy=startAt, sortOrder=asc)
    const [sortBy, sortOrder] = sortParam.split("_");

    // Lấy danh mục 1 lần khi load trang
    useEffect(() => {
        async function fetchCategoriesData() {
            try {
                const res = await getCategories();
                if (res.data?.categories) {
                    setCategories(res.data.categories);
                } else if (Array.isArray(res.data)) {
                    setCategories(res.data);
                }
            } catch (err) {
                console.error("Lỗi khi tải danh mục:", err);
            }
        }
        fetchCategoriesData();
    }, []);

    // Cập nhật URL Search Params
    const updateSearchParams = useCallback(
        (newParams) => {
            const current = Object.fromEntries(searchParams.entries());
            const merged = { ...current, ...newParams };

            // Loại bỏ các key rỗng
            Object.keys(merged).forEach((key) => {
                if (merged[key] === "" || merged[key] === null || merged[key] === undefined || merged[key] === false) {
                    delete merged[key];
                }
            });

            setSearchParams(merged);
        },
        [searchParams, setSearchParams]
    );

    // Tải danh sách sự kiện mỗi khi URL params thay đổi
    useEffect(() => {
        let isMounted = true;

        async function fetchEventsData() {
            setLoading(true);
            setError(null);

            try {
                const res = await getEvents({
                    page: currentPage,
                    limit: 9,
                    keyword,
                    categoryId,
                    location,
                    timeFrame,
                    startDate,
                    endDate,
                    isFree: isFree ? true : undefined,
                    minPrice,
                    maxPrice,
                    sortBy: sortBy || "startAt",
                    sortOrder: sortOrder || "asc",
                });

                if (isMounted) {
                    setEvents(res.data?.events || []);
                    setPagination(res.data?.pagination || null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || "Không thể tải danh sách sự kiện");
                    setEvents([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchEventsData();

        return () => {
            isMounted = false;
        };
    }, [
        currentPage,
        keyword,
        categoryId,
        location,
        timeFrame,
        startDate,
        endDate,
        isFree,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
    ]);

    // Xử lý thay đổi từng bộ lọc
    const handleFilterChange = (key, value) => {
        updateSearchParams({ [key]: value, page: 1 });
    };

    // Đặt lại toàn bộ bộ lọc
    const handleResetFilters = () => {
        setSearchParams({});
    };

    // Xóa từng tag bộ lọc
    const handleRemoveFilter = (key) => {
        if (key === "priceRange") {
            updateSearchParams({ minPrice: "", maxPrice: "", page: 1 });
        } else {
            updateSearchParams({ [key]: "", page: 1 });
        }
    };

    // Xử lý chuyển trang
    const handlePageChange = (newPage) => {
        updateSearchParams({ page: newPage });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const currentFilters = {
        keyword,
        categoryId,
        location,
        timeFrame,
        startDate,
        endDate,
        isFree,
        minPrice,
        maxPrice,
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            {/* Thân trang: Sidebar lọc và Lưới sự kiện */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
                <div className="flex gap-8 items-start">
                    {/* Cột bộ lọc nâng cao bên trái */}
                    <EventFilterSidebar
                        filters={currentFilters}
                        onFilterChange={handleFilterChange}
                        onResetFilters={handleResetFilters}
                        isOpenMobile={isMobileFilterOpen}
                        onCloseMobile={() => setIsMobileFilterOpen(false)}
                    />

                    {/* Cột hiển thị sự kiện bên phải */}
                    <div className="flex-1 min-w-0">
                        {/* Thanh chọn danh mục nhanh & sắp xếp */}
                        <EventFilterBar
                            categories={categories}
                            selectedCategory={categoryId}
                            onCategoryChange={(catId) => handleFilterChange("categoryId", catId)}
                            sortBy={sortParam}
                            onSortChange={(val) => handleFilterChange("sort", val)}
                            totalEvents={pagination?.totalEvents || 0}
                            onToggleSidebar={() => setIsMobileFilterOpen(true)}
                        />

                        {/* Các tag bộ lọc đang áp dụng */}
                        <div className="mt-4">
                            <ActiveFilters
                                filters={currentFilters}
                                categories={categories}
                                onRemoveFilter={handleRemoveFilter}
                                onResetAll={handleResetFilters}
                            />
                        </div>

                        {/* Thông báo lỗi nếu có */}
                        {error && (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 mb-6">
                                {error}
                            </div>
                        )}

                        {/* Trạng thái tải hoặc Danh sách sự kiện */}
                        {loading ? (
                            <EventSkeleton count={6} />
                        ) : (
                            <>
                                <EventGrid
                                    events={events}
                                    onResetFilters={handleResetFilters}
                                />

                                {/* Phân trang */}
                                <EventPagination
                                    pagination={pagination}
                                    onPageChange={handlePageChange}
                                />
                            </>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

