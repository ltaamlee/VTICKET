import { Search, RotateCcw } from "lucide-react";

const statuses = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "DRAFT", label: "Bản nháp" },
    { value: "PENDING", label: "Chờ duyệt" },
    { value: "APPROVED", label: "Đã duyệt" },
    { value: "PUBLISHED", label: "Đang công khai" },
    { value: "REJECTED", label: "Bị từ chối" },
    { value: "SUSPENDED", label: "Đang bị khóa" },
    { value: "CANCELLED", label: "Đã hủy" },
    { value: "COMPLETED", label: "Đã hoàn thành" },
];

export default function EventToolbar({
    keyword,
    status,
    onKeywordChange,
    onStatusChange,
    onReset,
}) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 md:flex-row">
            <div className="relative flex-1">
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => onKeywordChange(e.target.value)}
                    placeholder="Tìm theo tên sự kiện, địa điểm..."
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
                />
            </div>

            <select
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
                {statuses.map((item) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </select>

            <button
                type="button"
                onClick={onReset}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm hover:bg-gray-50"
            >
                <RotateCcw size={16} />
                Đặt lại
            </button>
        </div>
    );
}