import { useState } from "react";
import IconButton from "../../../../components/common/button/IconButton";
import EventDetailModal from "../../../organizer/components/events/modals/EventDetailModal";

function EventTable({
    events = [],
    loading = false,
    onApprove,
    onReject,
    onSuspend,
    onRestore,
    onCancel,
}) {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalType, setModalType] = useState(null);

    const eventList = Array.isArray(events)
        ? events
        : Array.isArray(events?.events)
            ? events.events
            : [];

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

    const handleView = (event) => {
        setSelectedEvent(event);
        setModalType("detail");
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
        setModalType(null);
    };

    const formatDate = (date) => {
        if (!date) return "--";

        return new Date(date).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };

    const getOrganizerName = (event) =>
        event.organizer?.organizerProfile?.organizationName ||
        event.organizer?.profile?.fullName ||
        event.organizer?.username ||
        "—";

    return (
        <>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-5 py-4">Sự kiện</th>
                            <th className="px-5 py-4">Ban tổ chức</th>
                            <th className="px-5 py-4">Danh mục</th>
                            <th className="px-5 py-4">Thời gian</th>
                            <th className="px-5 py-4">Trạng thái</th>
                            <th className="w-[220px] px-5 py-4 text-center">
                                Thao tác
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                                    Đang tải danh sách sự kiện...
                                </td>
                            </tr>
                        ) : eventList.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center">
                                    <p className="mb-2 font-medium text-gray-600">
                                        Chưa có dữ liệu sự kiện
                                    </p>
                                    <p className="text-gray-400">
                                        Không tìm thấy sự kiện phù hợp.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            eventList.map((event, index) => {
                                const status = statusConfig[event.status] || {
                                    label: event.status || "Không xác định",
                                    className: "bg-gray-100 text-gray-600",
                                };

                                return (
                                    <tr
                                        key={event.id || event._id || index}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={event.thumbnailUrl || "/placeholder.png"}
                                                    alt=""
                                                    className="h-12 w-16 rounded-lg object-cover"
                                                />

                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {event.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {event.location || "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-medium">
                                                {getOrganizerName(event)}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {event.organizer?.email || "—"}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            {event.category?.name || "—"}
                                        </td>

                                        <td className="px-5 py-4">
                                            {formatDate(event.startAt)}
                                            {" - "}
                                            {formatDate(event.endAt)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                                            >
                                                {status.label}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <IconButton
                                                    icon="view"
                                                    variant="view"
                                                    title="Xem chi tiết"
                                                    onClick={() => handleView(event)}
                                                />

                                                {event.status === "PENDING" && (
                                                    <>
                                                        <IconButton
                                                            icon="approve"
                                                            variant="approve"
                                                            title="Duyệt"
                                                            onClick={() => onApprove?.(event)}
                                                        />

                                                        <IconButton
                                                            icon="reject"
                                                            variant="reject"
                                                            title="Từ chối"
                                                            onClick={() => onReject?.(event)}
                                                        />
                                                    </>
                                                )}

                                                {event.status === "APPROVED" && (
                                                    <>
                                                        <IconButton
                                                            icon="lock"
                                                            variant="suspend"
                                                            title="Khóa sự kiện"
                                                            onClick={() => onSuspend?.(event)}
                                                        />

                                                        <IconButton
                                                            icon="delete"
                                                            variant="delete"
                                                            title="Hủy sự kiện"
                                                            onClick={() => onCancel?.(event)}
                                                        />
                                                    </>
                                                )}

                                                {event.status === "SUSPENDED" && (
                                                    <IconButton
                                                        icon="unlock"
                                                        variant="restore"
                                                        title="Mở khóa"
                                                        onClick={() => onRestore?.(event)}
                                                    />
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

            {modalType === "detail" && selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    onClose={handleCloseModal}
                    onAlert={(type, message) =>
                        console[type === "error" ? "error" : "log"](
                            message
                        )
                    }
                    onApprove={() => {
                        handleCloseModal();
                        onApprove?.(selectedEvent);
                    }}
                    onReject={() => {
                        handleCloseModal();
                        onReject?.(selectedEvent);
                    }}
                    showSubmit={false}
                    scope="admin"
                />
            )}
        </>
    );
}

export default EventTable;