export default function StatCard({
    label,
    value,
    icon: Icon,
    bg = "bg-sky-50",
    iconBg = "bg-sky-500",
    loading = false,
    formatValue,
    detail,
}) {
    return (
        <div
            className={`relative flex items-center justify-between overflow-hidden rounded-2xl ${bg} p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
        >
            {/* Nội dung thống kê */}
            <div className="relative z-10 min-w-0">
                <p className="truncate text-sm font-medium text-gray-600">
                    {label}
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                    {loading
                        ? "..."
                        : formatValue
                            ? formatValue(value ?? 0)
                            : (value ?? 0).toLocaleString("vi-VN")}
                </p>
                {detail && (
                    <p className="mt-1 text-xs text-gray-500">{detail}</p>
                )}
            </div>

            {/* Icon bên phải */}
            {Icon && (
                <div
                    className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg} text-white shadow-sm`}
                >
                    <Icon size={24} strokeWidth={2} />
                </div>
            )}

            {/* Hình trang trí */}
            <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-black/[0.03]" />
        </div>
    );
}
