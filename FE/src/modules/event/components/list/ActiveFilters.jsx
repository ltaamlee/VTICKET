import { X } from "lucide-react";

/**
 * ActiveFilters - Hiển thị các tag bộ lọc đang được áp dụng
 */
export default function ActiveFilters({
    filters,
    categories = [],
    onRemoveFilter,
    onResetAll,
}) {
    const tags = [];

    // Từ khóa
    if (filters.keyword) {
        tags.push({
            key: "keyword",
            label: `Từ khóa: "${filters.keyword}"`,
        });
    }

    // Danh mục
    if (filters.categoryId) {
        const cat = categories.find((c) => c.id === filters.categoryId);
        tags.push({
            key: "categoryId",
            label: `Danh mục: ${cat ? cat.name : filters.categoryId}`,
        });
    }

    // Địa điểm
    if (filters.location) {
        tags.push({
            key: "location",
            label: `Địa điểm: ${filters.location}`,
        });
    }

    // Khung thời gian
    if (filters.timeFrame) {
        const labels = {
            today: "Hôm nay",
            this_week: "Tuần này",
            this_month: "Tháng này",
            upcoming: "Sắp diễn ra",
        };
        tags.push({
            key: "timeFrame",
            label: `Thời gian: ${labels[filters.timeFrame] || filters.timeFrame}`,
        });
    }

    // Vé miễn phí
    if (filters.isFree) {
        tags.push({
            key: "isFree",
            label: "Vé miễn phí",
        });
    }

    // Khoảng giá
    if (filters.minPrice || filters.maxPrice) {
        const minStr = filters.minPrice ? `${Number(filters.minPrice).toLocaleString("vi-VN")} đ` : "0 đ";
        const maxStr = filters.maxPrice ? `${Number(filters.maxPrice).toLocaleString("vi-VN")} đ` : "∞";
        tags.push({
            key: "priceRange",
            label: `Giá: ${minStr} - ${maxStr}`,
        });
    }

    if (tags.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs text-gray-500 font-medium">Đang lọc theo:</span>

            {tags.map((tag) => (
                <span
                    key={tag.key}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700"
                >
                    {tag.label}
                    <button
                        type="button"
                        onClick={() => onRemoveFilter(tag.key)}
                        className="rounded-full p-0.5 hover:bg-blue-200/60 text-blue-500 transition"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </span>
            ))}

            <button
                type="button"
                onClick={onResetAll}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline underline-offset-2 ml-2"
            >
                Xóa tất cả
            </button>
        </div>
    );
}

