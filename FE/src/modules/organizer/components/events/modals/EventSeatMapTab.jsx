import { Armchair } from "lucide-react";

import SeatMapPreview from "../../seatmaps/SeatMapPreview";
import { ZONE_TYPE_LABEL } from "../../seatmaps/seatmapConstants";

const SEAT_MAP_STATUS = {
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

export default function EventSeatMapTab({ seatMap }) {
    if (!seatMap) {
        return (
            <div className="rounded-xl bg-gray-50/80 p-5">
                <p className="text-sm text-gray-500">
                    Sự kiện này chưa được gắn sơ đồ ghế. Bạn có thể chọn
                    sơ đồ ở tab Quản lý sơ đồ ghế.
                </p>
            </div>
        );
    }
    const zones = seatMap.zones || [];

    const seatMapStatus =
        SEAT_MAP_STATUS[seatMap.status] || {
            label: seatMap.status || "Chưa xác định",
            className: "bg-gray-100 text-gray-600",
        };

    const totalCapacity = zones
        .filter((zone) => zone.type !== "STAGE")
        .reduce((sum, zone) => {
            if (zone.type === "SEATED") {
                return (
                    sum +
                    (Number(zone.rowCount) || 0) *
                        (Number(zone.seatPerRow) || 0)
                );
            }

            return sum + (Number(zone.capacity) || 0);
        }, 0);

    return (
        <div className="space-y-5">
            {/* Tổng quan */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50/80 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                        <Armchair size={18} className="text-blue-600" />
                    </div>

                    <div>
                        <p className="text-xs text-gray-400">
                            Sơ đồ đang dùng
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-800">
                            {seatMap.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {zones.length} khu vực
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {totalCapacity.toLocaleString("vi-VN")} chỗ
                    </span>

                    <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${seatMapStatus.className}`}
                    >
                        {seatMapStatus.label}
                    </span>
                </div>
            </div>

            {/* Hình ảnh sơ đồ */}
            <SeatMapPreview seatMap={seatMap} />

            {/* Bảng giá vé theo khu vực */}
            {zones.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Khu vực</th>
                                <th className="px-4 py-3">Loại</th>
                                <th className="px-4 py-3">Sức chứa</th>
                                <th className="px-4 py-3 text-right">
                                    Giá vé
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {zones.map((zone) => {
                                const isStage = zone.type === "STAGE";

                                const capacity =
                                    zone.type === "SEATED"
                                        ? (Number(zone.rowCount) || 0) *
                                          (Number(zone.seatPerRow) || 0)
                                        : Number(zone.capacity) || 0;

                                return (
                                    <tr key={zone.id}>
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            zone.color ||
                                                            "#3b82f6",
                                                    }}
                                                />
                                                {zone.name}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {ZONE_TYPE_LABEL[zone.type] ||
                                                zone.type}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {isStage ? (
                                                <span className="text-gray-300">
                                                    —
                                                </span>
                                            ) : (
                                                capacity.toLocaleString(
                                                    "vi-VN"
                                                )
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-right font-medium text-gray-800">
                                            {isStage ? (
                                                <span className="text-gray-300">
                                                    —
                                                </span>
                                            ) : (
                                                (Number(zone.price) || 0)
                                                    .toLocaleString("vi-VN") +
                                                " đ"
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
