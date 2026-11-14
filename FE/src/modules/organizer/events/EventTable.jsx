import { useState } from "react";
import { Armchair } from "lucide-react";

import IconButton from "../../../components/common/button/IconButton";

import EventDetailModal from "./modals/EventDetailModal";
import EventFormModal from "./modals/EventFormModal";
import EventDeleteModal from "./modals/EventDeleteModal";

function EventTable({
    events = [],
    categories = [],
    loading = false,
    currentPage = 1,
    pageSize = 10,
    onRefresh,
    onAlert,
    onManageSeatMaps,
    seatMapRefreshKey = 0,
}) {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalType, setModalType] = useState(null);

    const handleView = (event) => {
        setSelectedEvent(event);
        setModalType("view");
    };

    const handleEdit = (event) => {
        setSelectedEvent(event);
        setModalType("edit");
    };

    const handleDelete = (event) => {
        setSelectedEvent(event);
        setModalType("delete");
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
        setModalType(null);
    };

    // Sang tab quản lý sơ đồ: đóng modal sửa trước vì overlay modal
    // sẽ che khuất tab bên dưới.
    const handleManageSeatMaps = () => {
        handleCloseModal();
        onManageSeatMaps?.();
    };

    const handleSuccess = (message) => {
        handleCloseModal();
        onRefresh?.();
        onAlert?.("success", message);
    };

    const formatDate = (date) => {
        if (!date) return "Chưa cập nhật";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Không hợp lệ";
        }

        return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(parsedDate);
    };

    const getStatus = (status) => {
        const statusMap = {
            DRAFT: {
                label: "Bản nháp",
                className: "bg-gray-100 text-gray-700",
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
                className: "bg-gray-100 text-gray-700",
            },
            COMPLETED: {
                label: "Đã kết thúc",
                className: "bg-blue-100 text-blue-700",
            },
        };

        return statusMap[status] || {
            label: status || "Chưa xác định",
            className: "bg-gray-100 text-gray-600",
        };
    };

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-5 py-4">STT</th>
                            <th className="min-w-[220px] px-5 py-4">
                                Tên sự kiện
                            </th>
                            <th className="px-5 py-4">Danh mục</th>
                            <th className="min-w-[180px] px-5 py-4">
                                Địa điểm
                            </th>
                            <th className="min-w-[160px] px-5 py-4">
                                Thời gian diễn ra
                            </th>
                            <th className="min-w-[140px] px-5 py-4">
                                Sơ đồ ghế
                            </th>
                            <th className="px-5 py-4">Trạng thái</th>
                            <th className="w-[180px] px-5 py-4 text-center">
                                Thao tác
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-5 py-12 text-center"
                                >
                                    Đang tải danh sách sự kiện...
                                </td>
                            </tr>
                        ) : events.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-5 py-12 text-center"
                                >
                                    <p className="mb-2 font-medium text-gray-600">
                                        Chưa có sự kiện
                                    </p>

                                    <p className="text-gray-400">
                                        Không tìm thấy sự kiện phù hợp.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            events.map((event, index) => {
                                const status = getStatus(event.status);

                                return (
                                    <tr
                                        key={event.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-5 py-4">
                                            {(currentPage - 1) * pageSize +
                                                index +
                                                1}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="font-medium text-gray-900">
                                                {event.name || "Chưa cập nhật"}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            {event.category?.name ||
                                                event.categoryName ||
                                                "Chưa phân loại"}
                                        </td>

                                        <td className="px-5 py-4">
                                            {event.location || "Chưa cập nhật"}
                                        </td>

                                        <td className="px-5 py-4">
                                            {formatDate(event.startAt)}
                                        </td>

                                        <td className="px-5 py-4">
                                            {event.seatMap ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                                    <Armchair size={13} />
                                                    {event.seatMap.name}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                                                    <Armchair size={13} />
                                                    Chưa gắn sơ đồ
                                                </span>
                                            )}
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
                                                    onClick={() =>
                                                        handleView(event)
                                                    }
                                                />

                                                <IconButton
                                                    icon="edit"
                                                    variant="edit"
                                                    title="Chỉnh sửa"
                                                    onClick={() =>
                                                        handleEdit(event)
                                                    }
                                                />

                                                <IconButton
                                                    icon="delete"
                                                    variant="delete"
                                                    title="Xóa sự kiện"
                                                    onClick={() =>
                                                        handleDelete(event)
                                                    }
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {modalType === "view" && (
                <EventDetailModal
                    event={selectedEvent}
                    onClose={handleCloseModal}
                />
            )}

            {modalType === "edit" && (
                <EventFormModal
                    mode="edit"
                    event={selectedEvent}
                    categories={categories}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                    onAlert={onAlert}
                    onManageSeatMaps={handleManageSeatMaps}
                    seatMapRefreshKey={seatMapRefreshKey}
                />
            )}

            {modalType === "delete" && (
                <EventDeleteModal
                    event={selectedEvent}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                    onAlert={onAlert}
                />
            )}
        </>
    );
}

export default EventTable;