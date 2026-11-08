import { Calendar, MapPin, DollarSign, RotateCcw, X } from "lucide-react";

/**
 * EventFilterSidebar - Cột bộ lọc nâng cao bên trái trang danh sách
 */
export default function EventFilterSidebar({
    filters,
    onFilterChange,
    onResetFilters,
    isOpenMobile,
    onCloseMobile,
}) {
    const popularLocations = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Nha Trang"];

    const timeFrames = [
        { label: "Tất cả thời gian", value: "" },
        { label: "Hôm nay", value: "today" },
        { label: "Tuần này", value: "this_week" },
        { label: "Tháng này", value: "this_month" },
        { label: "Sắp diễn ra", value: "upcoming" },
    ];

    const content = (
        <div className="space-y-6">
            {/* Tiêu đề & Nút đặt lại */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Bộ lọc tìm kiếm</h3>
                <button
                    type="button"
                    onClick={onResetFilters}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                    <RotateCcw className="h-3 w-3" />
                    Đặt lại
                </button>
            </div>

            {/* 1. Bộ lọc Thời gian */}
            <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    Thời gian
                </label>

                {/* Chọn nhanh khung thời gian */}
                <div className="space-y-1.5">
                    {timeFrames.map((tf) => (
                        <label
                            key={tf.value}
                            className="flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900 cursor-pointer py-1"
                        >
                            <input
                                type="radio"
                                name="timeFrame"
                                checked={(filters.timeFrame || "") === tf.value}
                                onChange={() => onFilterChange("timeFrame", tf.value)}
                                className="h-3.5 w-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span>{tf.label}</span>
                        </label>
                    ))}
                </div>

                {/* Hoặc chọn ngày tùy chỉnh */}
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    <span className="text-[11px] font-medium text-gray-500">Hoặc chọn khoảng ngày:</span>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <input
                                type="date"
                                value={filters.startDate || ""}
                                onChange={(e) => onFilterChange("startDate", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <input
                                type="date"
                                value={filters.endDate || ""}
                                onChange={(e) => onFilterChange("endDate", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Bộ lọc Địa điểm */}
            <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    Địa điểm
                </label>

                <input
                    type="text"
                    value={filters.location || ""}
                    onChange={(e) => onFilterChange("location", e.target.value)}
                    placeholder="Nhập tỉnh/thành phố..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                {/* Gợi ý địa điểm phổ biến */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {popularLocations.map((loc) => (
                        <button
                            key={loc}
                            type="button"
                            onClick={() => onFilterChange("location", filters.location === loc ? "" : loc)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                                filters.location === loc
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {loc}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Bộ lọc Giá vé */}
            <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5">
                    <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                    Giá vé (VNĐ)
                </label>

                {/* Tùy chọn vé miễn phí */}
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={Boolean(filters.isFree)}
                        onChange={(e) => onFilterChange("isFree", e.target.checked)}
                        className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Chỉ xem sự kiện miễn phí</span>
                </label>

                {/* Khoảng giá Min - Max */}
                {!filters.isFree && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="block text-[11px] text-gray-400 mb-1">Từ:</span>
                            <input
                                type="number"
                                min="0"
                                step="50000"
                                value={filters.minPrice || ""}
                                onChange={(e) => onFilterChange("minPrice", e.target.value)}
                                placeholder="0"
                                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <span className="block text-[11px] text-gray-400 mb-1">Đến:</span>
                            <input
                                type="number"
                                min="0"
                                step="50000"
                                value={filters.maxPrice || ""}
                                onChange={(e) => onFilterChange("maxPrice", e.target.value)}
                                placeholder="Tối đa"
                                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-20 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    {content}
                </div>
            </aside>

            {/* Mobile Drawer */}
            {isOpenMobile && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                        onClick={onCloseMobile}
                    />

                    {/* Drawer Content */}
                    <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white p-6 shadow-2xl flex flex-col z-10 overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                            <span className="font-bold text-gray-900">Bộ lọc nâng cao</span>
                            <button
                                type="button"
                                onClick={onCloseMobile}
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1">{content}</div>

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onCloseMobile}
                                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                                Xem kết quả
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

