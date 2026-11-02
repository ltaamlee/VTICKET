import {
    CalendarDays,
    Clock,
    CheckCircle,
    XCircle,
    Ban,
    CalendarCheck,
} from "lucide-react";

const statItems = [
    {
        key: "totalEvents",
        label: "Tổng sự kiện",
        icon: CalendarDays,
    },
    {
        key: "pendingEvents",
        label: "Chờ duyệt",
        icon: Clock,
    },
    {
        key: "publishedEvents",
        label: "Đang công khai",
        icon: CheckCircle,
    },
    {
        key: "rejectedEvents",
        label: "Bị từ chối",
        icon: XCircle,
    },
    {
        key: "suspendedEvents",
        label: "Đang bị khóa",
        icon: Ban,
    },
    {
        key: "completedEvents",
        label: "Đã hoàn thành",
        icon: CalendarCheck,
    },
];

export default function EventStats({ stats = {} }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statItems.map((item) => {
                const Icon = item.icon;

                return (
                    <div
                        key={item.key}
                        className="rounded-xl border border-gray-200 bg-white p-5"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                {item.label}
                            </p>

                            <Icon size={20} className="text-gray-500" />
                        </div>

                        <p className="mt-3 text-2xl font-semibold text-gray-900">
                            {stats[item.key] ?? 0}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}