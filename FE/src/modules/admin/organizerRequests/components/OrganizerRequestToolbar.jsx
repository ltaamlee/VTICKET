import { Search, RotateCcw } from "lucide-react";

export default function OrganizerRequestToolbar({
  searchInput,
  onSearchInputChange,
  statusFilter,
  onStatusFilterChange,
  onSearchSubmit,
  onResetFilters,
}) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
      <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          {/* Input tìm kiếm */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Tìm theo tên tổ chức, email, số điện thoại..."
              className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Filter trạng thái */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xét duyệt</option>
              <option value="APPROVED">Đã phê duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={onResetFilters}
            title="Đặt lại bộ lọc"
            className="rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-gray-50 transition"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
