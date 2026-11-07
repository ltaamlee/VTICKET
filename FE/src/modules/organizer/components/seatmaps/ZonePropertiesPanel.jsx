import { useCallback } from "react";
import { X, Trash2, Copy, Shapes, Lock, Trash, Grid3x3, Shuffle } from "lucide-react";

import CurrencyInput from "../../../../components/common/form/CurrencyInput";
import {
    POLYGON_PRESETS,
    ZoneShapeIcon,
    ZONE_SHAPES,
    buildPresetPoints,
} from "./zoneShapes";
import SeatGrid from "./seatGrid";
import { lettersToRowLabel } from "./seatNumbering";
import {
    blockSeatCell,
    removeSeatCell,
    restoreSeatCell,
    unblockSeatCell,
} from "./seatGridUtils";
import {
    DEFAULT_SHAPE,
    PRESET_SIZE_HINT,
    SHAPE_SIZE_HINT,
    ZONE_TYPES,
} from "./seatmapConstants";
import { formatVND } from "../../../../utils/formatCurrency";

const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50";

const labelClass = "mb-1.5 block text-xs font-medium text-gray-600";

/**
 * Panel thuộc tính khu vực, hiển thị bên phải canvas.
 */
export default function ZonePropertiesPanel({
    zone,
    selectedCount = 1,
    onChange,
    onClose,
    onDelete,
    onDuplicate,
    onFitSeats,
    seatTool = "none",
    onSeatToolChange,
}) {
    // Công cụ thao tác trên lưới ghế do cha điều khiển để đồng bộ
    // với nút trên thanh công cụ của canvas.
    const handleSeatToolChange = useCallback(
        (next) => {
            onSeatToolChange?.(next);
        },
        [onSeatToolChange]
    );

    if (!zone) return null;

    const isStage = zone.type === "STAGE";
    const isMulti = selectedCount > 1;

    /**
     * Xử lý bấm vào 1 ô trong lưới ghế.
     * Bấm lần 2 vào cùng ô sẽ bỏ khoá / khôi phục.
     */
    const handleSeatCellClick = (cell) => {
        if (seatTool === "none") return;

        const blockedSeats = zone.blockedSeats || [];
        const removedSeats = zone.removedSeats || [];

        // Ô đã bị xoá -> luôn cho phép khôi phục, bất kể công cụ nào.
        if (cell.removed) {
            onChange(zone.id, {
                ...restoreSeatCell(blockedSeats, removedSeats, cell.key),
            });

            return;
        }

        if (seatTool === "block") {
            const next = cell.blocked
                ? unblockSeatCell(
                      blockedSeats,
                      removedSeats,
                      cell.key
                  )
                : blockSeatCell(
                      blockedSeats,
                      removedSeats,
                      cell.key
                  );

            onChange(zone.id, next);

            return;
        }

        // seatTool === "remove"
        const next = removeSeatCell(
            blockedSeats,
            removedSeats,
            cell.key
        );

        onChange(zone.id, next);
    };

    const handleTypeChange = (type) => {
        onChange(zone.id, {
            type,
            ...(type === "SEATED"
                ? {
                      rowCount: zone.rowCount || 4,
                      seatPerRow: zone.seatPerRow || 8,
                  }
                : {}),
            ...(type === "STANDING"
                ? { capacity: zone.capacity || 50 }
                : {}),
            ...(type === "STAGE"
                ? {
                      rowCount: 0,
                      seatPerRow: 0,
                      capacity: 0,
                      price: 0,
                  }
                : {}),
        });
    };

    const handleShapeChange = (shape) => {
        const hint = SHAPE_SIZE_HINT[shape];

        onChange(zone.id, {
            shape,
            ...(hint
                ? {
                      width: Math.max(
                          hint.width,
                          zone.width || 0
                      ),
                      height: Math.max(
                          hint.height,
                          zone.height || 0
                      ),
                  }
                : {}),
            // Đổi sang hình thường thì xoá đỉnh tùy chỉnh & lỗ.
            ...(shape !== "POLYGON"
                ? { points: null, holes: null }
                : {}),
        });
    };

    /**
     * Áp dụng mẫu đa giác dựng sẵn (chữ T, U, L...) cho khu vực.
     * Toạ độ đỉnh được tính theo kích thước thật của zone.
     */
    const handlePresetChange = (preset) => {
        const hint = PRESET_SIZE_HINT[preset];

        const width = Math.max(
            hint?.width || zone.width || 160,
            zone.width || 0
        );

        const height = Math.max(
            hint?.height || zone.height || 140,
            zone.height || 0
        );

        onChange(zone.id, {
            shape: "POLYGON",
            width,
            height,
            points: buildPresetPoints(preset, width, height),
        });
    };

    /**
     * Đổi kích thước bằng tay -> scale lại đỉnh đa giác theo tỉ lệ mới
     * để hình không bị méo.
     */
    const handleSizeChange = (patch) => {
        const next = { ...patch };

        if (
            zone.shape === "POLYGON" &&
            Array.isArray(zone.points) &&
            zone.points.length >= 3
        ) {
            const oldWidth = zone.width || 1;
            const oldHeight = zone.height || 1;

            const newWidth = Number(next.width) || oldWidth;
            const newHeight = Number(next.height) || oldHeight;

            next.points = zone.points.map((p) => ({
                x: Math.max(
                    0,
                    Math.min(p.x * (newWidth / oldWidth), newWidth)
                ),
                y: Math.max(
                    0,
                    Math.min(p.y * (newHeight / oldHeight), newHeight)
                ),
            }));

            // Các lỗ (hình rỗng) cũng scale theo.
            if (Array.isArray(zone.holes)) {
                next.holes = zone.holes.map((hole) =>
                    hole.map((p) => ({
                        x: Math.max(
                            0,
                            Math.min(
                                p.x * (newWidth / oldWidth),
                                newWidth
                            )
                        ),
                        y: Math.max(
                            0,
                            Math.min(
                                p.y * (newHeight / oldHeight),
                                newHeight
                            )
                        ),
                    }))
                );
            }
        }

        onChange(zone.id, next);
    };

    /**
     * Đổi số hàng / số ghế mỗi hàng.
     *
     * Các ô đã khoá hoặc đã xoá nằm ngoài lưới mới sẽ bị loại bỏ
     * (tránh tồn đọng key không còn ý nghĩa).
     */
    const handleGridSizeChange = (patch) => {
        const nextRowCount = Math.max(
            0,
            Number(
                patch.rowCount ?? zone.rowCount ?? 0
            ) || 0
        );

        const nextSeatPerRow = Math.max(
            0,
            Number(
                patch.seatPerRow ?? zone.seatPerRow ?? 0
            ) || 0
        );

        // Chỉ giữ lại các ô còn nằm trong lưới mới.
        // Nhãn hàng là CHỮ CÁI (A, B, C...) -> phải đổi sang số
        // để so sánh với rowCount.
        const isInsideGrid = (key) => {
            const [row, col] = String(key)
                .split("|")
                .map((value) => Number(value) || 0);

            const rowNumber = lettersToRowLabel(row);

            return (
                rowNumber >= 1 &&
                rowNumber <= nextRowCount &&
                col >= 1 &&
                col <= nextSeatPerRow
            );
        };

        onChange(zone.id, {
            ...patch,
            rowCount: nextRowCount,
            seatPerRow: nextSeatPerRow,
            // Kích thước ô giữ nguyên -> khối tự phình/co theo lưới.
            // Ô luôn VUÔNG: cạnh = min(rộng/cột, cao/hàng).
            ...(() => {
                const currentRows = Number(zone.rowCount) || 0;
                const currentCols = Number(zone.seatPerRow) || 0;

                if (currentRows === 0 || currentCols === 0) {
                    return {};
                }

                const cell = Math.max(
                    4,
                    Math.floor(
                        Math.min(
                            (Number(zone.width) || 0) / currentCols,
                            (Number(zone.height) || 0) / currentRows
                        )
                    )
                );

                return {
                    width: Math.max(40, cell * nextSeatPerRow),
                    height: Math.max(30, cell * nextRowCount),
                };
            })(),
            blockedSeats: (zone.blockedSeats || []).filter(
                isInsideGrid
            ),
            removedSeats: (zone.removedSeats || []).filter(
                isInsideGrid
            ),
        });
    };

    const activePreset = (() => {
        if (zone.shape !== "POLYGON") return null;

        const current = zone.points || [];

        if (current.length < 3) return null;

        const match = POLYGON_PRESETS.find((preset) => {
            if (preset.points.length !== current.length) return false;

            return preset.points.every(([px, py], index) => {
                const point = current[index];

                if (!point) return false;

                const width = zone.width || 1;
                const height = zone.height || 1;

                return (
                    Math.abs(point.x - px * width) < 1 &&
                    Math.abs(point.y - py * height) < 1
                );
            });
        });

        return match?.value || null;
    })();

    return (
        <div className="flex h-full flex-col bg-white">
            {/* HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                    <ZoneShapeIcon
                        shape={zone.shape || DEFAULT_SHAPE}
                        color={zone.color}
                        size={20}
                    />

                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-gray-900">
                            {zone.name || "Khu vực"}
                        </h3>
                        <p className="text-[11px] text-gray-400">
                            {ZONE_TYPES.find(
                                (t) => t.value === zone.type
                            )?.label || zone.type}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onDuplicate?.(zone.id)}
                        title="Nhân bản khu vực (Ctrl+D)"
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                        <Copy size={15} />
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete?.(zone.id)}
                        title="Xoá khu vực (Delete)"
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                        <Trash2 size={15} />
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        title="Đóng bảng thuộc tính"
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>

            {/* BODY */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                {/* Tên + Mã */}
                <div className="space-y-3">
                    {isMulti && (
                        <div className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                            Đang chọn{" "}
                            <span className="font-bold">
                                {selectedCount}
                            </span>{" "}
                            khu vực. Các thuộc tính bên dưới áp dụng
                            cho khối đầu tiên.
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Tên khu vực</label>
                        <input
                            value={zone.name}
                            onChange={(e) =>
                                onChange(zone.id, {
                                    name: e.target.value,
                                })
                            }
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Mã</label>
                        <input
                            value={zone.code || ""}
                            onChange={(e) =>
                                onChange(zone.id, {
                                    code: e.target.value,
                                })
                            }
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* Loại + Hình dạng */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>Loại</label>
                        <select
                            value={zone.type}
                            onChange={(e) =>
                                handleTypeChange(e.target.value)
                            }
                            className={inputClass}
                        >
                            {ZONE_TYPES.map((type) => (
                                <option
                                    key={type.value}
                                    value={type.value}
                                >
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>Hình dạng</label>
                        <select
                            value={zone.shape || DEFAULT_SHAPE}
                            onChange={(e) =>
                                handleShapeChange(e.target.value)
                            }
                            className={inputClass}
                        >
                            {ZONE_SHAPES.map((shape) => (
                                <option
                                    key={shape.value}
                                    value={shape.value}
                                >
                                    {shape.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {zone.shape === "POLYGON" && (
                    <div>
                        <label className={labelClass}>
                            <span className="inline-flex items-center gap-1">
                                <Shapes size={12} />
                                Mẫu hình dạng
                            </span>
                        </label>

                        <div className="grid grid-cols-4 gap-1.5">
                            {POLYGON_PRESETS.map((preset) => {
                                const isActive =
                                    activePreset === preset.value;

                                const width = zone.width || 160;
                                const height = zone.height || 140;

                                return (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() =>
                                            handlePresetChange(
                                                preset.value
                                            )
                                        }
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

                        <p className="mt-1.5 text-[11px] text-gray-400">
                            Chọn mẫu rồi kéo các đỉnh trên canvas để chỉnh
                            chi tiết.
                        </p>
                    </div>
                )}

                {/* Màu */}
                <div>
                    <label className={labelClass}>Màu</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={zone.color || "#3b82f6"}
                            onChange={(e) =>
                                onChange(zone.id, {
                                    color: e.target.value,
                                })
                            }
                            className="h-[38px] w-14 cursor-pointer rounded-lg border border-gray-200 bg-white px-1"
                        />

                        <input
                            value={zone.color || "#3b82f6"}
                            onChange={(e) =>
                                onChange(zone.id, {
                                    color: e.target.value,
                                })
                            }
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* Ticket price - stage zones don't sell tickets */}
                {!isStage && (
                    <div>
                        <label className={labelClass}>
                            Giá vé (VNĐ)
                        </label>

                        <CurrencyInput
                            value={zone.price || 0}
                            onChange={(price) =>
                                onChange(zone.id, { price })
                            }
                            className={inputClass}
                        />

                        {zone.price > 0 && (
                            <p className="mt-1 text-[11px] text-gray-400">
                                = {formatVND(zone.price)}
                            </p>
                        )}
                    </div>
                )}

                {/* Capacity */}
                {zone.type === "SEATED" && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>
                                    Số hàng
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={zone.rowCount ?? ""}
                                    onChange={(e) =>
                                        handleGridSizeChange({
                                            rowCount: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Ghế mỗi hàng
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={zone.seatPerRow ?? ""}
                                    onChange={(e) =>
                                        handleGridSizeChange({
                                            seatPerRow: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Lưới ghế: khoá / xoá từng ô */}
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                                    <Grid3x3 size={13} />
                                    Lưới ghế
                                </p>

                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onFitSeats?.(zone.id)}
                                        disabled={
                                            zone.type !== "SEATED" ||
                                            !zone.rowCount ||
                                            !zone.seatPerRow
                                        }
                                        title="Căn chỉnh lại lưới ghế: mọi ô vuông và bằng nhau"
                                        className="rounded-md border border-gray-200 px-1.5 py-1 text-[10px] font-medium text-gray-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Grid3x3 size={11} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSeatToolChange(
                                                seatTool === "block"
                                                    ? "none"
                                                    : "block"
                                            )
                                        }
                                        title="Chế độ khoá ghế"
                                        className={`rounded-md border px-1.5 py-1 text-[10px] font-medium transition ${
                                            seatTool === "block"
                                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                                : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        <Lock size={11} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSeatToolChange(
                                                seatTool === "remove"
                                                    ? "none"
                                                    : "remove"
                                            )
                                        }
                                        title="Chế độ xoá ghế"
                                        className={`rounded-md border px-1.5 py-1 text-[10px] font-medium transition ${
                                            seatTool === "remove"
                                                ? "border-red-500 bg-red-50 text-red-700"
                                                : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        <Trash size={11} />
                                    </button>
                                </div>
                            </div>

                            <SeatGrid
                                zone={zone}
                                tool={seatTool}
                                onCellClick={handleSeatCellClick}
                            />

                            <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
                                {seatTool === "block"
                                    ? "Bấm vào ghế để khoá (không bán vé). Bấm lần 2 để bỏ khoá."
                                    : seatTool === "remove"
                                      ? "Bấm vào ô để xoá ghế (tạo hàng so le). Bấm lần 2 để khôi phục."
                                      : "Chọn công cụ khoá hoặc xoá rồi bấm vào ô tương ứng."}
                            </p>
                        </div>

                        {/* Chiều đánh số ghế khi trả vé ngẫu nhiên */}
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                                <Shuffle size={13} />
                                Chiều trả ghế ngẫu nhiên
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        onChange(zone.id, {
                                            seatNumbering: "ROW",
                                        })
                                    }
                                    className={`rounded-md border px-2 py-1.5 text-left text-[10px] font-medium transition ${
                                        (zone.seatNumbering || "ROW") ===
                                        "ROW"
                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    <span className="block font-semibold">
                                        Theo hàng
                                    </span>
                                    <span className="block font-normal text-gray-400">
                                        A1, A2, A3, B1...
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        onChange(zone.id, {
                                            seatNumbering: "COLUMN",
                                        })
                                    }
                                    className={`rounded-md border px-2 py-1.5 text-left text-[10px] font-medium transition ${
                                        zone.seatNumbering === "COLUMN"
                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    <span className="block font-semibold">
                                        Theo cột
                                    </span>
                                    <span className="block font-normal text-gray-400">
                                        A1, B1, C1, A2...
                                    </span>
                                </button>
                            </div>

                            <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
                                Khi khách mua nhiều vé, hệ thống sắp xếp
                                ngẫu nhiên theo chiều này để các ghế được
                                trả ra luôn nằm gần nhau.
                            </p>
                        </div>
                    </div>
                )}

                {zone.type === "STANDING" && (
                    <div>
                        <label className={labelClass}>Sức chứa</label>
                        <input
                            type="number"
                            min="0"
                            value={zone.capacity}
                            onChange={(e) =>
                                onChange(zone.id, {
                                    capacity: e.target.value,
                                })
                            }
                            className={inputClass}
                        />
                    </div>
                )}

                {/* Position & size */}
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Vị trí & kích thước
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>X (px)</label>
                            <input
                                type="number"
                                value={zone.posX}
                                onChange={(e) =>
                                    onChange(zone.id, {
                                        posX: e.target.value,
                                    })
                                }
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Y (px)</label>
                            <input
                                type="number"
                                value={zone.posY}
                                onChange={(e) =>
                                    onChange(zone.id, {
                                        posY: e.target.value,
                                    })
                                }
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Rộng (px)</label>
                            <input
                                type="number"
                                min="40"
                                value={zone.width}
                                onChange={(e) =>
                                    handleSizeChange({
                                        width: e.target.value,
                                    })
                                }
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Cao (px)</label>
                            <input
                                type="number"
                                min="30"
                                value={zone.height}
                                onChange={(e) =>
                                    handleSizeChange({
                                        height: e.target.value,
                                    })
                                }
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Xoay (độ)</label>
                            <input
                                type="number"
                                min="-180"
                                max="180"
                                value={zone.rotation || 0}
                                onChange={(e) =>
                                    onChange(zone.id, {
                                        rotation: e.target.value,
                                    })
                                }
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Tầng</label>
                            <input
                                type="number"
                                min="1"
                                value={zone.level}
                                onChange={(e) =>
                                    onChange(zone.id, {
                                        level: e.target.value,
                                    })
                                }
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                {/* Seat information */}
                {zone.type === "SEATED" && (
                    <div className="space-y-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                        <div>
                            Tổng ghế trong lưới:{" "}
                            <span className="font-bold">
                                {(
                                    (Number(zone.rowCount) || 0) *
                                    (Number(zone.seatPerRow) || 0)
                                ).toLocaleString("vi-VN")}
                            </span>
                        </div>

                        {(zone.blockedSeats?.length > 0 ||
                            zone.removedSeats?.length > 0) && (
                            <div className="space-y-0.5 text-[11px] text-blue-600">
                                {zone.blockedSeats?.length > 0 && (
                                    <p>
                                        Ghế bị khoá:{" "}
                                        <span className="font-bold">
                                            {zone.blockedSeats.length}
                                        </span>
                                    </p>
                                )}

                                {zone.removedSeats?.length > 0 && (
                                    <p>
                                        Ô đã xoá:{" "}
                                        <span className="font-bold">
                                            {zone.removedSeats.length}
                                        </span>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
