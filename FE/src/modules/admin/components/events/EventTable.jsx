import {
    Eye,
    Check,
    X,
    Lock,
    Unlock,
    Ban,
} from "lucide-react";

const statusConfig = {
    DRAFT: {
        label: "Bản nháp",
        className: "bg-gray-100 text-gray-600",
    },
    PENDING: {
        label: "Chờ duyệt",
        className: "bg-yellow-100 text-yellow-700",
    },
    APPROVED: {
        label: "Đã duyệt",
        className: "bg-blue-100 text-blue-700",
    },
    PUBLISHED: {
        label: "Đang công khai",
        className: "bg-green-100 text-green-700",
    },
    REJECTED: {
        label: "Bị từ chối",
        className: "bg-red-100 text-red-700",
    },
    SUSPENDED: {
        label: "Đang bị khóa",
        className: "bg-orange-100 text-orange-700",
    },
    CANCELLED: {
        label: "Đã hủy",
        className: "bg-gray-200 text-gray-700",
    },
    COMPLETED: {
        label: "Đã hoàn thành",
        className: "bg-purple-100 text-purple-700",
    },
};

function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("vi-VN");
}

export default function EventTable({
    events = [],
    loading,
    onView,
    onApprove,
    onReject,
    onSuspend,
    onRestore,
    onCancel,
}) {
    if (loading) {
        return (
            <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
                Đang tải dữ liệu...
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                    <tr>
                        <th className="px-5 py-4">Sự kiện</th>
                        <th className="px-5 py-4">Ban tổ chức</th>
                        <th className="px-5 py-4">Danh mục</th>
                        <th className="px-5 py-4">Ngày diễn ra</th>
                        <th className="px-5 py-4">Trạng thái</th>
                        <th className="px-5 py-4 text-center">Thao tác</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                    {events.length === 0 ? (
                        <tr>
                            <td
                                colSpan="6"
                                className="px-5 py-10 text-center text-gray-500"
                            >
                                Không tìm thấy sự kiện
                            </td>
                        </tr>
                    ) : (
                        events.map((event) => {
                            const status =
                                statusConfig[event.status] ||
                                statusConfig.DRAFT;

                            return (
                                <tr key={event.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={
                                                    event.bannerUrl ||
                                                    "/placeholder.png"
                                                }
                                                alt=""
                                                className="h-12 w-16 rounded-lg object-cover"
                                            />

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {event.name}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {event.location}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <p className="font-medium">
                                            {event.organizer?.organizerProfile
                                                ?.organizationName ||
                                                event.organizer?.profile
                                                    ?.fullName ||
                                                event.organizer?.username ||
                                                "—"}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {event.organizer?.email}
                                        </p>
                                    </td>

                                    <td className="px-5 py-4">
                                        {event.category?.name || "—"}
                                    </td>

                                    <td className="px-5 py-4">
                                        {formatDate(event.startAt)}
                                    </td>

                                    <td className="px-5 py-4">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                                        >
                                            {status.label}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                title="Xem chi tiết"
                                                onClick={() => onView(event)}
                                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                            >
                                                <Eye size={17} />
                                            </button>

                                            {event.status === "PENDING" && (
                                                <>
                                                    <button
                                                        title="Duyệt"
                                                        onClick={() => onApprove(event)}
                                                        className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                                                    >
                                                        <Check size={17} />
                                                    </button>

                                                    <button
                                                        title="Từ chối"
                                                        onClick={() => onReject(event)}
                                                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                    >
                                                        <X size={17} />
                                                    </button>
                                                </>
                                            )}

                                            {["APPROVED", "PUBLISHED"].includes(
                                                event.status
                                            ) && (
                                                <>
                                                    <button
                                                        title="Khóa sự kiện"
                                                        onClick={() => onSuspend(event)}
                                                        className="rounded-lg p-2 text-orange-600 hover:bg-orange-50"
                                                    >
                                                        <Lock size={17} />
                                                    </button>

                                                    <button
                                                        title="Hủy sự kiện"
                                                        onClick={() => onCancel(event)}
                                                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                    >
                                                        <Ban size={17} />
                                                    </button>
                                                </>
                                            )}

                                            {event.status === "SUSPENDED" && (
                                                <button
                                                    title="Mở khóa"
                                                    onClick={() => onRestore(event)}
                                                    className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                                                >
                                                    <Unlock size={17} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}