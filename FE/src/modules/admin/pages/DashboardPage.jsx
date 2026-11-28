import { useEffect, useState } from "react";
import {
    CircleAlert,
    ClipboardList,
    DollarSign,
    UserRound,
    CalendarDays,
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
import Pagination from "../../../components/common/Pagination";
import DateRangeFilter, { getDefaultDateRange } from "../../../components/common/DateRangeFilter";
import { getDashboardData } from "../services/dashboardService";

const PAGE_SIZE = 10;

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

function AdminDashboardPage() {
    const [dateRange, setDateRange] = useState(() => getDefaultDateRange(7));
    const [dashboard, setDashboard] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        getDashboardData({ page, pageSize: PAGE_SIZE, ...dateRange })
            .then((response) => {
                if (!cancelled) {
                    setDashboard(response.data);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (!cancelled) {
                    setError(
                        requestError.message || "Không thể tải dashboard."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [page, dateRange]);

    if (loading && !dashboard) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Đang tải dashboard...
            </div>
        );
    }

    if (error && !dashboard) {
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
    const totalPages = dashboard?.pagination?.totalPages || 1;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Dashboard quản trị
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Tổng quan hoạt động và tình hình giao dịch của VTICKET.
                    </p>
                </div>
                <DateRangeFilter
                    value={dateRange}
                    onChange={(nextRange) => {
                        setPage(1);
                        setDateRange(nextRange);
                    }}
                />
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Doanh thu theo kỳ"
                    value={stats.totalRevenue ?? 0}
                    detail={`${dateRange.startDate} → ${dateRange.endDate}`}
                    icon={DollarSign}
                    bg="bg-emerald-50"
                    iconBg="bg-emerald-600"
                    formatValue={currency.format}
                    loading={loading}
                />
                <StatCard
                    label="Người dùng"
                    value={stats.totalUsers ?? 0}
                    detail="Tài khoản trên hệ thống"
                    icon={UserRound}
                    bg="bg-indigo-50"
                    iconBg="bg-indigo-600"
                    loading={loading}
                />
                <StatCard
                    label="Sự kiện"
                    value={stats.totalEvents ?? 0}
                    detail="Tất cả trạng thái"
                    icon={CalendarDays}
                    bg="bg-violet-50"
                    iconBg="bg-violet-600"
                    loading={loading}
                />
                <StatCard
                    label="Đơn hàng theo kỳ"
                    value={stats.totalOrders ?? 0}
                    detail={`${dateRange.startDate} → ${dateRange.endDate}`}
                    icon={ClipboardList}
                    bg="bg-amber-50"
                    iconBg="bg-amber-600"
                    loading={loading}
                />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5">
                    <h2 className="font-semibold text-slate-900">
                        Biểu đồ doanh thu ({dateRange.startDate} → {dateRange.endDate})
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Tổng hợp từ các giao dịch thanh toán thành công.
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
                                        id="adminRevenue"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#10b981"
                                            stopOpacity={0.22}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#10b981"
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
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    fill="url(#adminRevenue)"
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="py-12 text-center text-sm text-slate-500">
                        Chưa có dữ liệu doanh thu trong khoảng thời gian này.
                    </p>
                )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="font-semibold text-slate-900">
                        Sự kiện mới nhất
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Các sự kiện mới được tạo trên hệ thống.
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-5 py-3 font-semibold">STT</th>
                                <th className="px-5 py-3 font-semibold">Sự kiện</th>
                                <th className="px-5 py-3 font-semibold">Ban tổ chức</th>
                                <th className="px-5 py-3 font-semibold">Ngày diễn ra</th>
                                <th className="px-5 py-3 font-semibold">Vé</th>
                                <th className="px-5 py-3 font-semibold">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentEvents.length ? (
                                recentEvents.map((event, index) => (
                                    <tr key={event.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-4 text-slate-500">
                                            {(page - 1) * PAGE_SIZE + index + 1}
                                        </td>
                                        <td className="px-5 py-4 font-medium text-slate-800">
                                            {event.name}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {event.organizer?.profile?.fullName ||
                                                event.organizer?.email ||
                                                "—"}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {event.startAt
                                                ? new Date(
                                                      event.startAt
                                                  ).toLocaleDateString("vi-VN")
                                                : "—"}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {event._count?.tickets ?? 0}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                {eventStatusLabels[event.status] ||
                                                    event.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-12 text-center text-slate-500"
                                    >
                                        Chưa có sự kiện.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={(nextPage) => {
                        setLoading(true);
                        setPage(nextPage);
                    }}
                />
            </section>
        </div>
    );
}

export default AdminDashboardPage;
