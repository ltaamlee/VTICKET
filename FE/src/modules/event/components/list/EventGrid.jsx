import { SearchX, RotateCcw } from "lucide-react";
import EventCard from "../common/EventCard";

/**
 * EventGrid - Hiển thị lưới sự kiện hoặc thông báo trống nếu không tìm thấy
 */
export default function EventGrid({ events = [], onResetFilters }) {
    if (!events || events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white py-16 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500 mb-4">
                    <SearchX className="h-8 w-8" />
                </div>

                <h3 className="text-lg font-bold text-gray-900">
                    Không tìm thấy sự kiện phù hợp
                </h3>

                <p className="mt-2 text-sm text-gray-500 max-w-md">
                    Không có sự kiện nào khớp với tiêu chí tìm kiếm của bạn. Hãy thử thay đổi từ khóa, danh mục hoặc khoảng thời gian.
                </p>

                {onResetFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Xóa tất cả bộ lọc
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    );
}

