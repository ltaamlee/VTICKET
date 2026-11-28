import { SearchX, RotateCcw, Ticket } from "lucide-react";
import ResaleCard from "./ResaleCard";

/**
 * ResaleList - Danh sách tin bán vé, kèm trạng thái rỗng / lỗi.
 */
export default function ResaleList({
    listings = [],
    loading = false,
    error = "",
    emptyTitle = "Chưa có vé bán lại",
    emptyDescription = "Hiện chưa có tin bán vé nào đang mở. Hãy quay lại sau nhé.",
    onResetFilters,
    onCancel,
    onPurchase,
    busyId = null,
    showActions = false,
}) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[0, 1, 2].map((index) => (
                    <div
                        key={index}
                        className="h-44 animate-pulse rounded-xl border border-gray-200 bg-white"
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700"
            >
                {error}
            </div>
        );
    }

    if (!listings || listings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-4 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                    {error ? (
                        <SearchX className="h-7 w-7" />
                    ) : (
                        <Ticket className="h-7 w-7" />
                    )}
                </div>

                <h3 className="text-base font-semibold text-gray-900">
                    {emptyTitle}
                </h3>
                <p className="mt-1.5 max-w-md text-sm text-gray-500">
                    {emptyDescription}
                </p>

                {onResetFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Xóa tất cả bộ lọc
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {listings.map((listing) => (
                <ResaleCard
                    key={listing.id}
                    listing={listing}
                    onCancel={onCancel}
                    onPurchase={onPurchase}
                    busy={busyId === listing.id}
                    showActions={showActions}
                />
            ))}
        </div>
    );
}
