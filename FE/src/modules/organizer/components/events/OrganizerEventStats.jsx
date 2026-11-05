import {
    CalendarDays,
    FileEdit,
    Clock,
    CheckCircle,
    XCircle,
    Ban,
} from "lucide-react";

import StatCard from "../../../../components/common/stats/StatCard";

/**
 * Thống kê sự kiện phía Ban tổ chức.
 *
 * BTC cần thấy đủ vòng đời sự kiện của mình nên hiển thị cả 6 trạng thái.
 */
const statItems = [
    {
        key: "totalEvents",
        label: "Tổng sự kiện",
        icon: CalendarDays,
        bg: "bg-sky-50",
        iconBg: "bg-sky-500",
    },
    {
        key: "draftEvents",
        label: "Bản nháp",
        icon: FileEdit,
        bg: "bg-slate-50",
        iconBg: "bg-slate-500",
    },
    {
        key: "pendingEvents",
        label: "Chờ duyệt",
        icon: Clock,
        bg: "bg-amber-50",
        iconBg: "bg-amber-500",
    },
    {
        key: "approvedEvents",
        label: "Đã duyệt",
        icon: CheckCircle,
        bg: "bg-emerald-50",
        iconBg: "bg-emerald-500",
    },
    {
        key: "rejectedEvents",
        label: "Bị từ chối",
        icon: XCircle,
        bg: "bg-rose-50",
        iconBg: "bg-rose-500",
    },
    {
        key: "cancelledEvents",
        label: "Đã hủy",
        icon: Ban,
        bg: "bg-gray-100",
        iconBg: "bg-gray-500",
    },
];

export default function OrganizerEventStats({
    stats = {},
    loading = false,
}) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {statItems.map((item) => (
                <StatCard
                    key={item.key}
                    label={item.label}
                    value={stats[item.key]}
                    icon={item.icon}
                    bg={item.bg}
                    iconBg={item.iconBg}
                    loading={loading}
                />
            ))}
        </div>
    );
}
