import { useState, useEffect } from "react";
import { Users, UserCheck, Building2 } from "lucide-react";
import { getUserStats } from "../../services/userService";
import StatCard from "../../../../components/common/stats/StatCard";

function UserStats() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        customerCount: 0,
        organizerCount: 0,
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await getUserStats();
                setStats({
                    totalUsers: response.data.totalUsers,
                    customerCount: response.data.customerCount,
                    organizerCount: response.data.orgranizerCount,
                });
            } catch (error) {
                console.error("Lỗi thống kê tài khoản: ", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    return (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
                label="Tổng tài khoản"
                value={stats.totalUsers}
                icon={Users}
                bg="bg-sky-50"
                iconBg="bg-sky-500"
                loading={loading}
            />
            <StatCard
                label="Khách hàng"
                value={stats.customerCount}
                icon={UserCheck}
                bg="bg-emerald-50"
                iconBg="bg-emerald-500"
                loading={loading}
            />
            <StatCard
                label="Nhà tổ chức"
                value={stats.organizerCount}
                icon={Building2}
                bg="bg-indigo-50"
                iconBg="bg-indigo-500"
                loading={loading}
            />
        </div>
    );
}

export default UserStats;
