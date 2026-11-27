import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Repeat2 } from "lucide-react";

import Header from "../../../layout/Header";
import Footer from "../../../layout/Footer";
import Pagination from "../../../components/common/Pagination";
import ResaleList from "../components/ResaleList";
import { listResaleListings } from "../services/resaleService";

const PAGE_SIZE = 10;

/**
 * ResaleEventTicketsPage - Danh sách các vé bán lại của MỘT sự kiện.
 *
 * Được mở khi người dùng bấm vào card sự kiện ở trang sàn vé bán lại (/resales).
 */
export default function ResaleEventTicketsPage() {
    const { eventId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const [listings, setListings] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: PAGE_SIZE,
        total: 0,
        totalPages: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

        const fetchListings = async () => {
            if (!eventId) return;

            try {
                setLoading(true);
                setError("");

                const response = await listResaleListings({
                    page,
                    pageSize: PAGE_SIZE,
                    eventId,
                });

                if (!isMounted) return;

                const result = response?.data?.data ?? response?.data ?? {};

                const items =
                    result?.listings ?? result?.items ?? result?.data ?? [];

                setListings(items);

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
                        "Không thể tải danh sách vé bán lại. Vui lòng thử lại."
                );

                setListings([]);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchListings();

        return () => {
            isMounted = false;
        };
    }, [page, eventId]);

    // Thông tin sự kiện được suy ra từ tin bán đầu tiên
    const eventInfo = listings[0]?.ticket?.event ?? null;

    const handlePageChange = (nextPage) => {
        updateSearchParams({
            page: nextPage > 1 ? nextPage : "",
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
                <Link
                    to="/resales"
                    className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-blue-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại sàn vé bán lại
                </Link>

                {/* Header sự kiện */}
                {eventInfo && (
                    <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row">
                            {eventInfo.thumbnailUrl && (
                                <div className="h-40 shrink-0 overflow-hidden bg-gray-100 sm:h-auto sm:w-56">
                                    <img
                                        src={eventInfo.thumbnailUrl}
                                        alt={eventInfo.name || "Sự kiện"}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            )}

                            <div className="flex flex-1 flex-col justify-center p-5">
                                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                                    <Repeat2 className="h-3 w-3" />
                                    Vé đang được bán lại
                                </span>

                                <h1 className="mt-2 text-xl font-semibold text-gray-900">
                                    {eventInfo.name || "Sự kiện"}
                                </h1>

                                <div className="mt-2 space-y-1 text-xs text-gray-600">
                                    {eventInfo.startAt && (
                                        <p className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                            {formatDate(eventInfo.startAt)}
                                        </p>
                                    )}
                                    {eventInfo.location && (
                                        <p className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                            <span className="line-clamp-1">
                                                {eventInfo.location}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Danh sách vé bán lại */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Vé đang bán lại
                    </h2>

                    {!loading && !error && (
                        <p className="text-sm text-gray-500">
                            Tìm thấy{" "}
                            <span className="font-semibold text-gray-900">
                                {pagination?.total ?? listings.length}
                            </span>{" "}
                            vé
                        </p>
                    )}
                </div>

                <ResaleList
                    listings={listings}
                    loading={loading}
                    error={error}
                    emptyTitle="Sự kiện này chưa có vé bán lại"
                    emptyDescription="Các vé đã được bán hết hoặc chưa có người đăng bán. Hãy quay lại sau nhé."
                    onResetFilters={() => updateSearchParams({ page: "" })}
                />

                {!loading && !error && (pagination?.totalPages || 0) > 1 && (
                    <div className="mt-8 flex justify-center">
                        <Pagination
                            page={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
