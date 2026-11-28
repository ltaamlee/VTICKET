import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * EventPagination - Thanh phân trang cho danh sách sự kiện
 */
export default function EventPagination({ pagination, onPageChange }) {
    if (!pagination || pagination.totalPages <= 1) return null;

    const { currentPage, totalPages, totalEvents } = pagination;

    // Tạo mảng số trang hiển thị
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxPagesToShow - 1);

            if (end - start < maxPagesToShow - 1) {
                start = Math.max(1, end - maxPagesToShow + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    return (
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500">
                Hiển thị trang <span className="font-semibold text-gray-800">{currentPage}</span> trên tổng số{" "}
                <span className="font-semibold text-gray-800">{totalPages}</span> ({totalEvents} sự kiện)
            </div>

            <div className="flex items-center gap-1.5">
                {/* Nút Trang trước */}
                <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Các nút số trang */}
                {getPageNumbers().map((page) => (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition ${
                            currentPage === page
                                ? "bg-blue-600 text-white shadow-xs"
                                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        {page}
                    </button>
                ))}

                {/* Nút Trang sau */}
                <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

