import { useState } from "react";
import { Link } from "react-router-dom";
import AccountLayout from "../../../components/layout/AccountLayout";
import {
  Ticket,
  Sparkles,
} from "lucide-react";

export default function MyTicketsPage() {
  const [filter, setFilter] = useState("all"); // 'all' | 'upcoming' | 'completed'

  // Danh sách vé (kết nối API vé điện tử)
  const tickets = [];

  return (
    <AccountLayout>
      {/* Tiêu đề & Bộ lọc */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-blue-600" />
            Vé đã mua của bạn
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý các vé sự kiện điện tử và mã QR check-in vào cửa
          </p>
        </div>

        {/* Bộ lọc vé */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "all"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Tất cả (0)
          </button>
          <button
            type="button"
            onClick={() => setFilter("upcoming")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "upcoming"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Sắp diễn ra (0)
          </button>
          <button
            type="button"
            onClick={() => setFilter("completed")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "completed"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Đã qua (0)
          </button>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Tổng số vé đã mua
          </p>
          <p className="mt-2 text-2xl font-black text-gray-900">0</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            Vé có hiệu lực sắp tới
          </p>
          <p className="mt-2 text-2xl font-black text-blue-700">0</p>
        </div>
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Vé đã sử dụng / Hết hạn
          </p>
          <p className="mt-2 text-2xl font-black text-gray-400">0</p>
        </div>
      </div>

      {/* Danh sách vé hoặc Trạng thái trống */}
      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-8 sm:p-14 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 shadow-inner">
            <Ticket className="h-10 w-10" />
          </div>
          <h3 className="mt-5 text-lg font-bold text-gray-900">
            Bạn chưa có vé sự kiện nào
          </h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Các sự kiện âm nhạc, giải trí và hội thảo hấp dẫn đang được mở bán. Hãy chọn ngay cho mình một chỗ ngồi yêu thích!
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              Khám phá sự kiện ngay
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Ticket item card list */}
        </div>
      )}
    </AccountLayout>
  );
}
