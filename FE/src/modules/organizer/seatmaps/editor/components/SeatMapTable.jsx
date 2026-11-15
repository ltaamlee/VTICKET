import { useState } from "react";
import { Armchair, Grid3x3 } from "lucide-react";

import IconButton from "../../../../../components/common/button/IconButton";
import Pagination from "../../../../../components/common/Pagination";

const PAGE_SIZE = 10;

function SeatMapTable({
    seatMaps = [],
    loading = false,
    onEdit,
    onDuplicate,
    onDelete,
}) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(seatMaps.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const visibleSeatMaps = seatMaps.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const getStatus = (status) => {
        const statusMap = {
            DRAFT: {
                label: "Bản nháp",
                className: "bg-gray-100 text-gray-700",
            },
            READY: {
                label: "Sẵn sàng",
                className: "bg-green-100 text-green-700",
            },
            ARCHIVED: {
                label: "Đã lưu trữ",
                className: "bg-orange-100 text-orange-700",
            },
        };

        return statusMap[status] || {
            label: status || "Chưa xác định",
            className: "bg-gray-100 text-gray-600",
        };
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                        <th className="px-5 py-4">STT</th>
                        <th className="px-5 py-4">Tên sơ đồ</th>
                        <th className="px-5 py-4">Khu vực</th>
                        <th className="px-5 py-4">Số chỗ</th>
                        <th className="px-5 py-4">Sự kiện đang dùng</th>
                        <th className="px-5 py-4">Trạng thái</th>
                        <th className="w-[120px] px-5 py-4 text-center">
                            Thao tác
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr>
                            <td
                                colSpan={7}
                                className="px-5 py-12 text-center"
                            >
                                Đang tải danh sách sơ đồ ghế...
                            </td>
                        </tr>
                    ) : seatMaps.length === 0 ? (
                        <tr>
                            <td
                                colSpan={7}
                                className="px-5 py-12 text-center"
                            >
                                <p className="mb-2 font-medium text-gray-600">
                                    Chưa có sơ đồ ghế nào
                                </p>

                                <p className="text-gray-400">
                                    Tạo sơ đồ ghế trước, sau đó gắn vào
                                    sự kiện.
                                </p>
                            </td>
                        </tr>
                    ) : (
                        visibleSeatMaps.map((seatMap, index) => {
                            const status = getStatus(seatMap.status);

                            return (
                                <tr
                                    key={seatMap.id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-5 py-4">
                                        {(currentPage - 1) * PAGE_SIZE +
                                            index +
                                            1}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                <Armchair size={18} />
                                            </div>

                                            <div className="font-medium text-gray-900">
                                                {seatMap.name}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Grid3x3 size={14} className="text-gray-400" />
                                            {seatMap.zoneCount || 0} khu vực
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {(
                                            seatMap.capacity ||
                                            seatMap.seatCount ||
                                            0
                                        ).toLocaleString("vi-VN")}
                                    </td>

                                    <td className="px-5 py-4">
                                        {seatMap.event ? (
                                            <span className="font-medium text-gray-800">
                                                {seatMap.event.name}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">
                                                Chưa gắn
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
                                                icon="edit"
                                                variant="edit"
                                                title="Chỉnh sửa sơ đồ"
                                                onClick={() =>
                                                    onEdit?.(seatMap)
                                                }
                                            />

                                            <IconButton
                                                icon="copy"
                                                variant="copy"
                                                title="Nhân bản sơ đồ ghế"
                                                onClick={() =>
                                                    onDuplicate?.(seatMap)
                                                }
                                            />

                                            <IconButton
                                                icon="delete"
                                                variant="delete"
                                                title="Xóa sơ đồ"
                                                disabled={Boolean(
                                                    seatMap.event
                                                )}
                                                onClick={() =>
                                                    onDelete?.(seatMap)
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
            <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}

export default SeatMapTable;