import { memo, useRef, useState } from "react";
import { Armchair, Grid3x3, Drama, Shapes } from "lucide-react";
import {
    ZONE_SHAPES,
    buildPresetPoints,
} from "../../../../utils/canvas/shapeGeometry";
import ZoneShapeIcon from "./ZoneShapeIcon";
import PolygonPresetPicker from "./PolygonPresetPicker";
import {
    DEFAULT_SHAPE,
    GRID_SIZE,
    PRESET_SIZE_HINT,
    SHAPE_SIZE_HINT,
    TYPE_SIZE_HINT,
    ZONE_COLORS,
    ZONE_TYPES,
} from "../../../../constants/seatmapConstants";

const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50";

const labelClass = "mb-1.5 block text-xs font-medium text-gray-600";

/**
 * Panel bên trái: thông tin sơ đồ + thêm khu vực.
 *
 * Bọc trong memo vì panel này chỉ cần `zones.length` - không cần
 * render lại mỗi lần kéo hình trên canvas.
 */
function SeatMapSidebar({
    // Thông tin sơ đồ
    name,
    onNameChange,
    canvasWidth,
    canvasHeight,
    onCanvasWidthChange,
    onCanvasHeightChange,
    totalSeats,

    // Thêm khu vực
    zones = [],
    onAddZone,
}) {
    const [newShape, setNewShape] = useState(DEFAULT_SHAPE);
    const newShapeRef = useRef(DEFAULT_SHAPE);
    const [newPreset, setNewPreset] = useState(null);
    const newPresetRef = useRef(null);
    const zoneCounterRef = useRef(0);

    const handleSelectShape = (shape) => {
        newShapeRef.current = shape;
        setNewShape(shape);

        if (shape !== "POLYGON") {
            newPresetRef.current = null;
            setNewPreset(null);
        }
    };

    const handleSelectPreset = (preset) => {
        newPresetRef.current = preset;
        setNewPreset(preset);

        newShapeRef.current = "POLYGON";
        setNewShape("POLYGON");
    };

    const handleAdd = (type) => {
        if (zoneCounterRef.current < zones.length) {
            zoneCounterRef.current = zones.length;
        }

        zoneCounterRef.current += 1;

        const seq = zoneCounterRef.current;
        const zoneShape = newShapeRef.current;
        const preset = newPresetRef.current;

        const typeSize = TYPE_SIZE_HINT[type] || TYPE_SIZE_HINT.SEATED;
        const shapeSize =
            SHAPE_SIZE_HINT[zoneShape] ||
            (preset
                ? PRESET_SIZE_HINT[preset]
                : typeSize);

        const offset = seq * GRID_SIZE;

        const width = Math.max(typeSize.width, shapeSize.width);
        const height = Math.max(typeSize.height, shapeSize.height);

        onAddZone({
            id: `new-${seq}`,
            name:
                type === "STAGE"
                    ? seq === 1
                        ? "Sân khấu"
                        : `Sân khấu ${seq}`
                    : `Khu vực ${seq}`,
            code: "",
            color:
                type === "STAGE"
                    ? "#334155"
                    : ZONE_COLORS[(seq - 1) % ZONE_COLORS.length],
            type,
            shape: zoneShape,
            price: 0,
            rowCount: type === "SEATED" ? 4 : 0,
            seatPerRow: type === "SEATED" ? 8 : 0,
            capacity: type === "STANDING" ? 50 : 0,
            posX:
                Math.round((40 + (offset % 200)) / GRID_SIZE) * GRID_SIZE,
            posY:
                Math.round((40 + (offset % 160)) / GRID_SIZE) * GRID_SIZE,
            width,
            height,
            rotation: 0,
            level: 1,
            points: preset
                ? buildPresetPoints(preset, width, height)
                : null,
            seats: [],
        });
    };

    return (
        <div className="flex h-full flex-col overflow-y-auto">
            <div className="space-y-3 border-b border-gray-100 p-4">
                <div>
                    <label className={labelClass}>
                        Tên sơ đồ{" "}
                        <span className="text-red-500">*</span>
                    </label>

                    <input
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Ví dụ: Sơ đồ nhà hát Bến Thành"
                        className={inputClass}
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={labelClass}>
                            Rộng canvas
                        </label>
                        <input
                            type="number"
                            min="320"
                            max="4000"
                            step="20"
                            value={canvasWidth}
                            onChange={(e) =>
                                onCanvasWidthChange(
                                    Number(e.target.value) || 900
                                )
                            }
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            Cao canvas
                        </label>
                        <input
                            type="number"
                            min="320"
                            max="4000"
                            step="20"
                            value={canvasHeight}
                            onChange={(e) =>
                                onCanvasHeightChange(
                                    Number(e.target.value) || 600
                                )
                            }
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* Add zone */}
            <div className="px-4 pt-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">
                        Thêm khu vực
                    </h3>

                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                        {zones.length} khu vực
                    </span>
                </div>

                {/* Add zone button */}
                <div className="mt-3 flex gap-1.5">
                    {ZONE_TYPES.map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => handleAdd(type.value)}
                            title={type.description}
                            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        >
                            {type.value === "SEATED" && <Armchair size={13} />}
                            {type.value === "STANDING" && (
                                <Grid3x3 size={13} />
                            )}
                            {type.value === "STAGE" && <Drama size={13} />}
                            {type.label}
                        </button>
                    ))}
                </div>

                <p className="mb-1.5 mt-4 flex items-center gap-1 text-[11px] font-medium text-gray-500">
                    <Shapes size={12} />
                    Hình dạng khu vực
                </p>

                <div className="grid grid-cols-4 gap-1.5">
                    {ZONE_SHAPES.map((shape) => (
                        <button
                            key={shape.value}
                            type="button"
                            onClick={() =>
                                handleSelectShape(shape.value)
                            }
                            title={shape.label}
                            className={`flex items-center justify-center rounded-lg border py-1.5 transition ${
                                newShape === shape.value
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                        >
                            <ZoneShapeIcon
                                shape={shape.value}
                                color={
                                    newShape === shape.value
                                        ? "#3b82f6"
                                        : "#94a3b8"
                                }
                                size={20}
                            />
                        </button>
                    ))}
                </div>

                {/* Mẫu đa giác dựng sẵn - sân khấu hình chữ T/U/L */}
                {newShape === "POLYGON" && (
                    <PolygonPresetPicker
                        value={newPreset}
                        onChange={handleSelectPreset}
                    />
                )}
            </div>
        </div>
    );
}

function areEqual(prev, next) {
    return (
        prev.name === next.name &&
        prev.canvasWidth === next.canvasWidth &&
        prev.canvasHeight === next.canvasHeight &&
        prev.totalSeats === next.totalSeats &&
        prev.zones?.length === next.zones?.length &&
        prev.onNameChange === next.onNameChange &&
        prev.onCanvasWidthChange === next.onCanvasWidthChange &&
        prev.onCanvasHeightChange === next.onCanvasHeightChange &&
        prev.onAddZone === next.onAddZone
    );
}

export default memo(SeatMapSidebar, areEqual);
