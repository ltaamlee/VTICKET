import { useState, useEffect } from "react";
import { getUserStats } from "../../services/userService";

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
            }
            catch (error) {
                console.error("Lỗi thống kê tài khoản: ", error);
            }
            finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statItems = [
        {
            label: "Tổng tài khoản",
            value: stats.totalUsers,
            color: "text-black"
        },
        {
            label: "Khách hàng",
            value: stats.customerCount,
            color: "text-black"
        },
        {
            label: "Nhà tổ chức",
            value: stats.organizerCount,
            color: "text-black"
        }

    ]
    return (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {statItems.map((stat) => (
                <div
                    key={stat.label}
                    className="rounded-xl border border-gray-200 bg-white p-5"
                >
                    <p className="text-sm text-gray-500">{stat.label}</p>

                    <h2 className={`mt-2 text-2xl font-bold ${stat.color}`}>
                        {loading ? "..." : stat.value.toLocaleString("vi-VN")}
                    </h2>
                </div>
            ))}
        </div>
    );
}

export default UserStats;