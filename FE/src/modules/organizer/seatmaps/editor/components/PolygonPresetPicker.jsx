import { memo } from "react";
import { Shapes } from "lucide-react";

import { POLYGON_PRESETS } from "../../../../../utils/canvas/shapeGeometry";

/**
 * Bộ chọn mẫu đa giác dựng sẵn (lục giác, chữ T, U, L...).
 *
 * Dùng chung cho:
 *  - SeatMapSidebar (chọn hình khi thêm khu vực mới)
 *  - ZonePropertiesPanel (đổi hình của khu vực đang chọn)
 */
function PolygonPresetPicker({
    value = null,
    onChange,
    label = "Mẫu đa giác",
    showLabel = true,
}) {
    return (
        <div>
            {showLabel && (
                <p className="mb-1.5 mt-4 flex items-center gap-1 text-[11px] font-medium text-gray-500">
                    <Shapes size={12} />
                    {label}
                </p>
            )}

            <div className="grid grid-cols-4 gap-1.5">
                {POLYGON_PRESETS.map((preset) => {
                    const isActive = value === preset.value;

                    return (
                        <button
                            key={preset.value}
                            type="button"
                            onClick={() => onChange?.(preset.value)}
                            title={preset.label}
                            className={`flex items-center justify-center rounded-lg border py-1.5 transition ${
                                isActive
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                        >
                            <svg
                                viewBox="0 0 1 1"
                                className="h-5 w-5"
                            >
                                <polygon
                                    points={preset.points
                                        .map(
                                            ([x, y]) =>
                                                `${x},${y}`
                                        )
                                        .join(" ")}
                                    fill={
                                        isActive
                                            ? "#3b82f6"
                                            : "#94a3b8"
                                    }
                                />
                            </svg>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default memo(PolygonPresetPicker);
