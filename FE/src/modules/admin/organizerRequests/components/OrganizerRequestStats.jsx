import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function OrganizerRequestStats({ stats, loading }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tổng đơn */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Tổng số đơn</p>
          <div className="rounded-xl bg-gray-100 p-2 text-gray-600">
            <FileText className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-gray-900">
          {loading ? "..." : stats.total}
        </p>
        <p className="mt-1 text-xs text-gray-400">Tất cả yêu cầu gửi lên hệ thống</p>
      </div>

      {/* Chờ duyệt (PENDING) */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Chờ xét duyệt</p>
          <div className="rounded-xl bg-amber-100 p-2 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-amber-700">
          {loading ? "..." : stats.pending}
        </p>
        <p className="mt-1 text-xs text-amber-600/80">Cần ban quản trị xử lý</p>
      </div>

      {/* Đã duyệt (APPROVED) */}
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Đã phê duyệt</p>
          <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-emerald-700">
          {loading ? "..." : stats.approved}
        </p>
        <p className="mt-1 text-xs text-emerald-600/80">Đã nâng quyền ORGANIZER</p>
      </div>

      {/* Đã từ chối (REJECTED) */}
      <div className="rounded-2xl border border-red-200/80 bg-red-50/40 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-red-700">Đã từ chối</p>
          <div className="rounded-xl bg-red-100 p-2 text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-red-700">
          {loading ? "..." : stats.rejected}
        </p>
        <p className="mt-1 text-xs text-red-600/80">Hồ sơ không đạt yêu cầu</p>
      </div>
    </div>
  );
}
