import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, RotateCcw, Ticket } from "lucide-react";

import Header from "../../../layout/Header";
import Footer from "../../../layout/Footer";
import Pagination from "../../../components/common/Pagination";
import ResaleEventCard from "../components/ResaleEventCard";
import { listResaleEvents } from "../services/resaleService";

const PAGE_SIZE = 9;

/**
 * ResalePage - Sàn vé bán lại.
 *
 * Hiển thị theo dạng Card Sự Kiện (giống trang /events): gom các sự kiện
 * đang có vé bán lại. Bấm vào card sẽ mở danh sách các vé bán lại của sự kiện.
 */
const ResalePage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const keyword = searchParams.get("keyword") || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const [searchInput, setSearchInput] = useState(keyword);
    const [events, setEvents] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: PAGE_SIZE,
        total: 0,
        totalPages: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setSearchInput(keyword);
    }, [keyword]);

    const updateSearchParams = useCallback(
        (updates) => {
            const nextParams = new URLSearchParams(searchParams);

            Object.entries(updates).forEach(([key, value]) => {
                if (value === "" || value === null || value === undefined) {
                    nextParams.delete(key);
                } else {
                    nextParams.set(key, String(value));
                }
            });

            setSearchParams(nextParams);
        },
        [searchParams, setSearchParams]
    );

    useEffect(() => {
        let isMounted = true;

        const fetchEvents = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await listResaleEvents({
                    page,
                    pageSize: PAGE_SIZE,
                    keyword,
                });

                if (!isMounted) return;

                const result = response?.data?.data ?? response?.data ?? {};

                setEvents(result?.events ?? result?.items ?? []);

                setPagination(
                    result?.pagination ?? {
                        currentPage: page,
                        pageSize: PAGE_SIZE,
                        total: 0,
                        totalPages: 0,
                    }
                );
            } catch (err) {
                if (!isMounted) return;

                setError(
                    err?.response?.data?.message ||
                        "Không thể tải danh sách sự kiện bán lại. Vui lòng thử lại."
                );

                setEvents([]);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchEvents();

        return () => {
            isMounted = false;
        };
    }, [page, keyword]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();

        updateSearchParams({
            keyword: searchInput.trim(),
            page: "",
        });
    };

    const handleResetFilters = () => {
        setSearchInput("");

        updateSearchParams({
            keyword: "",
            page: "",
        });
    };

    const handlePageChange = (nextPage) => {
        updateSearchParams({
            page: nextPage > 1 ? nextPage : "",
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const total = pagination?.total ?? pagination?.totalEvents ?? events.length;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <Header />

            <main>
                {/* Hero */}
                <section className="border-b border-gray-200 bg-white">
                    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-12">
                        <div className="max-w-2xl">
                            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                                Vé đã bán lại
                            </h1>

                            <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                Chọn một sự kiện để xem các vé đang được rao bán lại.
                                Mọi giao dịch đều có mã vé và mã QR mới được tạo
                                riêng cho người mua.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Marketplace */}
                <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-12">
                    {/* Search */}
                    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex flex-col gap-3 sm:flex-row"
                        >
                            <div className="relative flex-1">
                                <Search
                                    size={19}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) =>
                                        setSearchInput(e.target.value)
                                    }
                                    placeholder="Tìm kiếm theo tên sự kiện..."
                                    className="h-12 w-full rounded-lg border border-transparent bg-gray-50 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-200 focus:bg-white focus:ring-2 focus:ring-blue-50"
                                />
                            </div>

                            <button
                                type="submit"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                <Search size={17} />
                                Tìm kiếm
                            </button>

                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                            >
                                <RotateCcw size={15} />
                                Đặt lại
                            </button>
                        </form>
                    </div>

                    {/* Heading */}
                    <div className="mb-6 mt-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Sự kiện đang có vé bán lại
                        </h2>

                        {!loading && !error && (
                            <p className="text-sm text-gray-500">
                                Tìm thấy{" "}
                                <span className="font-semibold text-gray-900">
                                    {total}
                                </span>{" "}
                                sự kiện
                            </p>
                        )}
                    </div>

                    {/* Thông báo lỗi */}
                    {error && (
                        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
                            {error}
                        </div>
                    )}

                    {/* Danh sách card sự kiện */}
                    <div className="min-h-[300px]">
                        {loading ? (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <div
                                        key={index}
                                        className="h-80 animate-pulse rounded-xl border border-gray-200 bg-white"
                                    />
                                ))}
                            </div>
                        ) : events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-4 py-16 text-center">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                                    <Ticket className="h-7 w-7" />
                                </div>

                                <h3 className="text-base font-semibold text-gray-900">
                                    Chưa có sự kiện bán lại
                                </h3>
                                <p className="mt-1.5 max-w-md text-sm text-gray-500">
                                    Hiện chưa có sự kiện nào có vé đang được rao bán
                                    lại. Hãy quay lại sau nhé.
                                </p>

                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-blue-700"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Xóa tất cả bộ lọc
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {events.map((event) => (
                                    <ResaleEventCard
                                        key={event.id}
                                        event={event}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading &&
                        !error &&
                        (pagination?.totalPages || 0) > 1 && (
                            <div className="mt-10 flex justify-center">
                                <Pagination
                                    page={pagination.currentPage}
                                    totalPages={pagination.totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default ResalePage;
