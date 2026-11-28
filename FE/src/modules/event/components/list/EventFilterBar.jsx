import { SlidersHorizontal, ArrowUpDown } from "lucide-react";

/**
 * EventFilterBar - Thanh công cụ danh mục nhanh và sắp xếp
 */
export default function EventFilterBar({
    categories = [],
    selectedCategory,
    onCategoryChange,
    sortBy,
    onSortChange,
    totalEvents = 0,
    onToggleSidebar,
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
            {/* Thanh chọn nhanh Danh mục (dạng tab ngang) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                <button
                    type="button"
                    onClick={() => onCategoryChange("")}
                    className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                        !selectedCategory
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    Tất cả
                </button>

                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => onCategoryChange(cat.id)}
                        className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                            selectedCategory === cat.id
                                ? "bg-blue-600 text-white shadow-xs"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Bộ chọn sắp xếp & Nút mở bộ lọc mobile */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-xs text-gray-500 font-medium hidden md:inline">
                    {totalEvents} sự kiện
                </span>

                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="lg:hidden flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs cursor-pointer"
                >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-gray-500" />
                    Bộ lọc nâng cao
                </button>

                <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-gray-400 hidden sm:block" />
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="startAt_asc">Sắp diễn ra</option>
                        <option value="createdAt_desc">Mới nhất</option>
                        <option value="name_asc">Tên (A-Z)</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
