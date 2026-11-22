import { useEffect, useState } from "react";
import {
    Activity,
    Armchair,
    CalendarDays,
    CircleAlert,
    Ticket,
    Wallet,
} from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import StatCard from "../../../components/common/stats/StatCard";
import { getDashboardData } from "../services/dashboardService";

const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
});
const compactNumber = new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
});
const eventStatusLabels = {
    DRAFT: "Bản nháp",
    PENDING: "Chờ duyệt",
    PENDING_APPROVAL: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Bị từ chối",
    CANCELLED: "Đã hủy",
    COMPLETED: "Đã kết thúc",
    SUSPENDED: "Tạm ngưng",
};

function OrganizerDashboardPage() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        getDashboardData()
            .then((response) => {
                if (!cancelled) setDashboard(response.data);
            })
            .catch((requestError) => {
                if (!cancelled) {
                    setError(
                        requestError.message || "Không thể tải tổng quan."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Đang tải tổng quan...
            </div>
        );
    }

    if (error) {
        return (
            <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            >
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                    <p className="font-semibold">Không tải được dữ liệu</p>
                    <p className="mt-1">{error}</p>
                </div>
            </div>
        );
    }

    const stats = dashboard?.statistics || {};
    const revenueByDay = dashboard?.revenueByDay || [];
    const recentEvents = dashboard?.recentEvents || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Theo dõi doanh thu, vé và các sự kiện của bạn.
                </p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Tổng sự kiện"
                    value={stats.totalEvents ?? 0}
                    detail={`${stats.upcomingEvents ?? 0} sự kiện sắp diễn ra`}
                    icon={CalendarDays}
                    bg="bg-indigo-50"
                    iconBg="bg-indigo-600"
                    loading={loading}
                />
                <StatCard
                    label="Doanh thu 7 ngày"
                    value={stats.revenue7Days ?? 0}
                    detail="Từ các đơn hàng đã thanh toán"
                    icon={Wallet}
                    bg="bg-emerald-50"
                    iconBg="bg-emerald-600"
                    formatValue={currency.format}
                    loading={loading}
                />
                <StatCard
                    label="Vé đã phát hành"
                    value={stats.issuedTickets ?? 0}
                    detail="Bao gồm vé đã check-in"
                    icon={Ticket}
                    bg="bg-violet-50"
                    iconBg="bg-violet-600"
                    loading={loading}
                />
                <StatCard
                    label="Đã check-in"
                    value={stats.checkedInTickets ?? 0}
                    detail="Tổng trên các sự kiện"
                    icon={Armchair}
                    bg="bg-amber-50"
                    iconBg="bg-amber-600"
                    loading={loading}
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5">
                        <h2 className="font-semibold text-slate-900">
                            Doanh thu 7 ngày gần nhất
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Chỉ tính các đơn hàng đã thanh toán.
                        </p>
                    </div>
                    {revenueByDay.length ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={revenueByDay}
                                    margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="organizerRevenue"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#4f46e5"
                                                stopOpacity={0.2}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#4f46e5"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        stroke="#e2e8f0"
                                        vertical={false}
                                        strokeDasharray="4 4"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) =>
                                            dateFormatter.format(new Date(`${value}T00:00:00`))
                                        }
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: "#64748b", fontSize: 12 }}
                                    />
                                    <YAxis
                                        tickFormatter={(value) =>
                                            compactNumber.format(value)
                                        }
                                        tickLine={false}
                                        axisLine={false}
                                        width={42}
                                        tick={{ fill: "#64748b", fontSize: 12 }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [
                                            currency.format(Number(value)),
                                            "Doanh thu",
                                        ]}
                                        labelFormatter={(value) =>
                                            dateFormatter.format(
                                                new Date(`${value}T00:00:00`)
                                            )
                                        }
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#4f46e5"
                                        strokeWidth={2.5}
                                        fill="url(#organizerRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="py-16 text-center text-sm text-slate-500">
                            Chưa có dữ liệu doanh thu.
                        </p>
                    )}
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Sự kiện gần đây
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Cập nhật hoạt động mới nhất.
                            </p>
                        </div>
                        <Activity className="h-5 w-5 text-indigo-600" />
                    </div>
                    {recentEvents.length ? (
                        <ul className="divide-y divide-slate-100">
                            {recentEvents.map((event) => (
                                <li key={event.id} className="py-4 first:pt-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-800">
                                                {event.name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {event.category?.name || "Chưa phân loại"}
                                                {" · "}
                                                {event._count?.tickets ?? 0} vé
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {event.startAt
                                                    ? new Date(event.startAt).toLocaleDateString(
                                                          "vi-VN"
                                                      )
                                                    : "Chưa có ngày"}
                                            </p>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                            {eventStatusLabels[event.status] ||
                                                event.status}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="py-12 text-center text-sm text-slate-500">
                            Chưa có sự kiện.
                        </p>
                    )}
                </article>
            </section>
        </div>
    );
}

export default OrganizerDashboardPage;
