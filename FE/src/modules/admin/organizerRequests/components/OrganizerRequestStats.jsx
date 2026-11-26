import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react";
import StatCard from "../../../../components/common/stats/StatCard";

export default function OrganizerRequestStats({ stats, loading }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Tổng số đơn"
        value={stats.total}
        icon={FileText}
        bg="bg-sky-50"
        iconBg="bg-sky-500"
        loading={loading}
        detail="Tất cả yêu cầu gửi lên hệ thống"
      />
      <StatCard
        label="Chờ xét duyệt"
        value={stats.pending}
        icon={Clock}
        bg="bg-amber-50"
        iconBg="bg-amber-500"
        loading={loading}
        detail="Cần ban quản trị xử lý"
      />
      <StatCard
        label="Đã phê duyệt"
        value={stats.approved}
        icon={CheckCircle2}
        bg="bg-emerald-50"
        iconBg="bg-emerald-500"
        loading={loading}
        detail="Đã nâng quyền ORGANIZER"
      />
      <StatCard
        label="Đã từ chối"
        value={stats.rejected}
        icon={XCircle}
        bg="bg-rose-50"
        iconBg="bg-rose-500"
        loading={loading}
        detail="Hồ sơ không đạt yêu cầu"
      />
    </div>
  );
}
