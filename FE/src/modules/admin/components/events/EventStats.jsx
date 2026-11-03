import {
    CalendarDays,
    Clock,
    CheckCircle,
    XCircle,
} from "lucide-react";

const statItems = [
    {
        key: "totalEvents",
        label: "Tổng sự kiện",
        icon: CalendarDays,
        color: {
            bg: "bg-sky-50",
            icon: "bg-sky-500",
            text: "text-sky-600",
        },
    },
    {
        key: "pendingEvents",
        label: "Chờ duyệt",
        icon: Clock,
        color: {
            bg: "bg-amber-50",
            icon: "bg-amber-500",
            text: "text-amber-600",
        },
    },
    {
        key: "publishedEvents",
        label: "Đang công khai",
        icon: CheckCircle,
        color: {
            bg: "bg-emerald-50",
            icon: "bg-emerald-500",
            text: "text-emerald-600",
        },
    },
    {
        key: "rejectedEvents",
        label: "Bị từ chối",
        icon: XCircle,
        color: {
            bg: "bg-rose-50",
            icon: "bg-rose-500",
            text: "text-rose-600",
        },
    },
];

export default function EventStats({ stats = {} }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statItems.map((item) => {
                const Icon = item.icon;

                return (
                    <div
                        key={item.key}
                        className={`relative flex items-center justify-between overflow-hidden rounded-2xl ${item.color.bg} p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
                    >
                        {/* Nội dung thống kê */}
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-gray-600">
                                {item.label}
                            </p>

                            <p className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
                                {(stats[item.key] ?? 0).toLocaleString("vi-VN")}
                            </p>
                        </div>

                        {/* Icon bên phải */}
                        <div
                            className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${item.color.icon} text-white shadow-sm`}
                        >
                            <Icon size={27} strokeWidth={2} />
                        </div>

                        {/* Hình trang trí */}
                        <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-black/[0.03]" />
                    </div>
                );
            })}
        </div>
    );
}