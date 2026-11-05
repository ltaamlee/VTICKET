import {
    CalendarDays,
    Clock,
    CheckCircle,
    XCircle,
    Lock,
} from "lucide-react";

import StatCard from "../../../../components/common/stats/StatCard";

/**
 * Thống kê sự kiện phía Admin.
 *
 * Chỉ hiển thị các trạng thái Admin cần thao tác:
 * tổng, chờ duyệt, đã duyệt, bị từ chối, đang bị khóa.
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
        key: "suspendedEvents",
        label: "Đang bị khóa",
        icon: Lock,
        bg: "bg-orange-50",
        iconBg: "bg-orange-500",
    },
];

export default function EventStats({ stats = {}, loading = false }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
