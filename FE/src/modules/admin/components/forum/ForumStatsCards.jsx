import {
    EyeOff,
    FileText,
    Heart,
    MessageSquare,
    ShieldAlert,
} from "lucide-react";
import StatCard from "../../../../components/common/stats/StatCard";

const statItems = [
    {
        key: "totalPosts",
        getValue: (stats) => stats?.posts?.total ?? 0,
        label: "Tổng bài viết",
        icon: FileText,
        bg: "bg-sky-50",
        iconBg: "bg-sky-500",
    },
    {
        key: "hiddenPosts",
        getValue: (stats) => stats?.posts?.hidden ?? 0,
        label: "Bài viết đang ẩn",
        icon: EyeOff,
        bg: "bg-amber-50",
        iconBg: "bg-amber-500",
    },
    {
        key: "totalComments",
        getValue: (stats) => stats?.comments?.total ?? 0,
        label: "Tổng bình luận",
        icon: MessageSquare,
        bg: "bg-indigo-50",
        iconBg: "bg-indigo-500",
    },
    {
        key: "hiddenComments",
        getValue: (stats) => stats?.comments?.hidden ?? 0,
        label: "Bình luận đang ẩn",
        icon: ShieldAlert,
        bg: "bg-orange-50",
        iconBg: "bg-orange-500",
    },
    {
        key: "totalReactions",
        getValue: (stats) => stats?.totalReactions ?? 0,
        label: "Lượt cảm xúc",
        icon: Heart,
        bg: "bg-rose-50",
        iconBg: "bg-rose-500",
    },
];

export default function ForumStatsCards({ stats = null, loading = false }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {statItems.map((item) => (
                <StatCard
                    key={item.key}
                    label={item.label}
                    value={item.getValue(stats)}
                    icon={item.icon}
                    bg={item.bg}
                    iconBg={item.iconBg}
                    loading={loading}
                />
            ))}
        </div>
    );
}

