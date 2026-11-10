import { memo, useMemo } from "react";
import { Group } from "react-konva";

import { buildSeatLayout } from "../../../../../utils/seats/seatLayout";
import { ZONE_TYPE_LABEL } from "../../../../../constants/seatmapConstants";

import ZoneShape from "../shapes/ZoneShape";
import SeatShape from "../shapes/SeatShape";
import TextShape from "../shapes/TextShape";
import StageShape from "../shapes/StageShape";
import TransformerHandles from "../shapes/TransformerHandles";
import PolygonPointsLayer from "../shapes/PolygonPointsLayer";

/**
 * Một khu vực (zone) trên canvas Konva.
 *
 * Cấu trúc:
 *   Group (đặt tâm tại giữa khối + xoay)
 *     └ Group (offset = -w/2, -h/2 -> toạ độ 0..w, 0..h)
 *         ├ Group (clip theo lưới ghế còn lại) -> ZoneShape / StageShape
 *         ├ ZoneShape trong suốt (bắt sự kiện chọn / kéo toàn khối)
 *         ├ Group (các ô ghế)
 *         ├ TextShape (tên + số chỗ)
 *         ├ PolygonPointsLayer (tay nắm đỉnh đa giác)
 *         └ TransformerHandles (tay nắm dãn / xoay)
 */
function ZoneLayer({
    zone,
    isSelected = false,
    hideHandles = false,
    seatTool = "none",
    isDragging = false,
    onPointerDown,
    onResizeStart,
    onRotateStart,
    onPointChange,
    onSeatCellClick,
}) {
    const width = Math.max(Number(zone?.width) || 0, 1);
    const height = Math.max(Number(zone?.height) || 0, 1);

    const rotation = Number(zone?.rotation) || 0;

    const isStage = zone?.type === "STAGE";

    const posX = Number(zone?.posX) || 0;
    const posY = Number(zone?.posY) || 0;

    // Sức chứa hiển thị trên nhãn.
    const capacity = useMemo(() => {
        if (zone?.type === "SEATED") {
            return (
                (Number(zone.rowCount) || 0) *
                (Number(zone.seatPerRow) || 0)
            );
        }

        if (zone?.type === "STANDING") {
            return Number(zone.capacity) || 0;
        }

        return null;
    }, [zone?.type, zone?.rowCount, zone?.seatPerRow, zone?.capacity]);

    // Lưới ghế (chỉ với zone SEATED).
    const seatLayout = useMemo(() => {
        if (zone?.type !== "SEATED") return null;

        const rowCount = Math.max(0, Number(zone.rowCount) || 0);
        const seatPerRow = Math.max(0, Number(zone.seatPerRow) || 0);

        if (rowCount === 0 || seatPerRow === 0) return null;

        return buildSeatLayout({
            rowCount,
            seatPerRow,
            width,
            height,
            removedSeats: zone.removedSeats,
            blockedSeats: zone.blockedSeats,
            numberingMode: zone.numberingMode,
            numberingConfig: zone.numberingConfig,
        });
    }, [
        zone,
        width,
        height,
    ]);

    const seatCells = seatLayout?.cells || [];
    const removedSeatCells = seatLayout?.removedCells || [];
    const seatClipBounds = seatLayout?.contentBounds || null;

    // Khi có ghế bị xoá, đường bao zone được cắt theo khung còn lại.
    const hasRemovedSeats = removedSeatCells.length > 0;

    // Vùng đặt nhãn: căn giữa phần còn lại của khối.
    const labelBounds = useMemo(() => {
        if (hasRemovedSeats && seatClipBounds) return seatClipBounds;

        return { x: 0, y: 0, width, height };
    }, [hasRemovedSeats, seatClipBounds, width, height]);

    // Lật gương: dùng scale âm theo trục.
    const flipX = zone?.flipX === true;
    const flipY = zone?.flipY === true;

    const showPoints =
        isSelected &&
        zone?.shape === "POLYGON" &&
        Array.isArray(zone?.points) &&
        zone.points.length >= 3;

    const stroke = isSelected
        ? "#1D4ED8"
        : "rgba(255,255,255,0.85)";

    const strokeWidth = isSelected ? 3 : 2;

    // Khối bị cắt theo lưới ghế còn lại.
    const clip =
        hasRemovedSeats && seatClipBounds
            ? {
                  x: seatClipBounds.x,
                  y: seatClipBounds.y,
                  width: seatClipBounds.width,
                  height: seatClipBounds.height,
              }
            : undefined;

    const handlePointerDown = (event) => {
        onPointerDown?.(event);
    };

    return (
        <Group
            id={`zone-${zone.id}`}
            name={`zone:${zone.id}`}
            x={posX + width / 2}
            y={posY + height / 2}
            rotation={rotation}
            opacity={isDragging ? 0.8 : 1}
        >
            <Group
                offsetX={width / 2}
                offsetY={height / 2}
                scaleX={flipX ? -1 : 1}
                scaleY={flipY ? -1 : 1}
            >
                {/* Thân hình khu vực (cắt theo lưới ghế còn lại) */}
                <Group clip={clip}>
                    {isStage ? (
                        <StageShape
                            shape={zone.shape}
                            width={width}
                            height={height}
                            points={zone.points}
                            holes={zone.holes}
                            color={zone.color || "#334155"}
                            stroke={stroke}
                            strokeWidth={strokeWidth}
                            listening={false}
                        />
                    ) : (
                        <ZoneShape
                            shape={zone.shape}
                            width={width}
                            height={height}
                            points={zone.points}
                            holes={zone.holes}
                            color={zone.color || "#3b82f6"}
                            stroke={stroke}
                            strokeWidth={strokeWidth}
                            listening={false}
                        />
                    )}
                </Group>

                {/* Lớp trong suốt bắt sự kiện chọn / kéo cho toàn khối.
                    Đặt SAU lớp ghế để ô ghế vẫn bấm được. */}
                <ZoneShape
                    shape={zone.shape || "RECTANGLE"}
                    width={width}
                    height={height}
                    points={zone.points}
                    holes={zone.holes}
                    color="rgba(0,0,0,0)"
                    stroke="rgba(0,0,0,0)"
                    strokeWidth={0}
                    onPointerDown={handlePointerDown}
                />

                {/* Đường bao của phần ghế còn lại */}
                {hasRemovedSeats && seatClipBounds && (
                    <ZoneShape
                        shape="RECTANGLE"
                        width={seatClipBounds.width}
                        height={seatClipBounds.height}
                        x={seatClipBounds.x}
                        y={seatClipBounds.y}
                        color="rgba(0,0,0,0)"
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        listening={false}
                    />
                )}

                {/* Các ô ghế */}
                {(seatCells.length > 0 || removedSeatCells.length > 0) && (
                    <Group listening={seatTool !== "none"}>
                        {seatCells.map((cell) => (
                            <SeatShape
                                key={cell.key}
                                cell={cell}
                                x={cell.x}
                                y={cell.y}
                                size={cell.size}
                                seatTool={seatTool}
                                onSeatCellClick={(clicked) =>
                                    onSeatCellClick?.(clicked)
                                }
                            />
                        ))}

                        {removedSeatCells.map((cell) => (
                            <SeatShape
                                key={cell.key}
                                cell={cell}
                                x={cell.x}
                                y={cell.y}
                                size={cell.size}
                                seatTool={seatTool}
                                onSeatCellClick={(clicked) =>
                                    onSeatCellClick?.(clicked)
                                }
                            />
                        ))}
                    </Group>
                )}

                {/* Tên + số chỗ */}
                <TextShape
                    name={zone.name || ""}
                    capacity={capacity}
                    capacityLabel={
                        capacity === null
                            ? ""
                            : isStage
                              ? ZONE_TYPE_LABEL.STAGE
                              : `${capacity} chỗ`
                    }
                    x={labelBounds.x}
                    y={labelBounds.y}
                    width={labelBounds.width}
                    height={labelBounds.height}
                    listening={false}
                />

                {/* Tay nắm đỉnh đa giác */}
                {showPoints && (
                    <PolygonPointsLayer
                        points={zone.points}
                        onPointChange={(event, index) => {
                            onPointChange?.(event, index);
                        }}
                    />
                )}

                {/* Tay nắm dãn / xoay */}
                {isSelected && !hideHandles && (
                    <TransformerHandles
                        width={width}
                        height={height}
                        rotation={rotation}
                        onResizeStart={(event, handle) =>
                            onResizeStart?.(event, handle)
                        }
                        onRotateStart={(event) =>
                            onRotateStart?.(event)
                        }
                    />
                )}
            </Group>
        </Group>
    );
}

export default memo(ZoneLayer);
