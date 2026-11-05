import { useEffect, useState } from "react";
import { Armchair, Check, LoaderCircle } from "lucide-react";

import { getSeatMaps } from "../../services/seatMapService";

function SeatMapPicker({
    value = "",
    onChange,
    onAlert,
    label = "Sơ đồ sự kiện",
    hint = "Sơ đồ sự kiện được tạo riêng ở tab Quản lý sơ đồ sự kiện.",
    refreshKey = 0,
}) {
    const [seatMaps, setSeatMaps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchSeatMaps = async () => {
            setLoading(true);

            try {
                const result = await getSeatMaps();

                if (cancelled) return;

                setSeatMaps(result?.data?.seatMaps || []);
            } catch (error) {
                if (cancelled) return;

                onAlert?.(
                    "error",
                    error.response?.data?.message ||
                        error.message ||
                        "Không thể tải danh sách sơ đồ ghế."
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchSeatMaps();

        return () => {
            cancelled = true;
        };
    }, [refreshKey]);

    const availableSeatMaps = seatMaps.filter(
        (seatMap) => !seatMap.event || seatMap.id === value
    );

    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {label}
            </label>

            {loading ? (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
                    <LoaderCircle size={16} className="animate-spin" />
                    Đang tải sơ đồ ghế...
                </div>
            ) : availableSeatMaps.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500">
                    <p className="font-medium text-gray-600">
                        Chưa có sơ đồ ghế nào
                    </p>
                    <p className="mt-1 text-xs">{hint}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Chọn không gắn sơ đồ */}
                    <button
                        type="button"
                        onClick={() => onChange?.("")}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                            !value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Armchair size={16} />
                            Không gắn sơ đồ ghế
                        </span>

                        {!value && <Check size={16} />}
                    </button>

                    {availableSeatMaps.map((seatMap) => {
                        const isSelected = value === seatMap.id;

                        return (
                            <button
                                key={seatMap.id}
                                type="button"
                                onClick={() => onChange?.(seatMap.id)}
                                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                                    isSelected
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                }`}
                            >
                                <span className="min-w-0">
                                    <span className="block truncate font-medium">
                                        {seatMap.name}
                                    </span>

                                    <span className="mt-0.5 block text-xs text-gray-400">
                                        {seatMap.zoneCount || 0} khu vực ·{" "}
                                        {(
                                            seatMap.capacity ||
                                            seatMap.seatCount ||
                                            0
                                        ).toLocaleString("vi-VN")}{" "}
                                        chỗ
                                    </span>
                                </span>

                                {isSelected && <Check size={16} />}
                            </button>
                        );
                    })}
                </div>
            )}

            {hint && availableSeatMaps.length > 0 && (
                <p className="mt-2 text-xs text-gray-400">{hint}</p>
            )}
        </div>
    );
}

export default SeatMapPicker;