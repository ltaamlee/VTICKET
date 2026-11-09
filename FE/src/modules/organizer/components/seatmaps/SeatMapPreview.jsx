import { useMemo } from "react";

import {
    buildShape,
    toPointsString,
} from "../../../../utils/canvas/shapeGeometry";
import { buildShapePath } from "../../../../utils/canvas/shapePath";
import {
    buildSeatCells,
    SEAT_GAP,
} from "../../../../utils/seats/seatLayout";
import { ZONE_TYPE_LABEL } from "../../../../constants/seatmapConstants";

function truncate(text, max = 22) {
    const value = String(text ?? "");

    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export default function SeatMapPreview({ seatMap, className = "" }) {
    const canvasWidth = Number(seatMap?.canvasWidth) || 900;
    const canvasHeight = Number(seatMap?.canvasHeight) || 600;
    const zones = seatMap?.zones || [];

    const levels = useMemo(() => {
        const map = new Map();

        [...zones]
            .sort(
                (a, b) =>
                    (Number(a.zIndex) || 0) -
                    (Number(b.zIndex) || 0)
            )
            .forEach((zone) => {
                const level = Number(zone.level) || 1;

                if (!map.has(level)) map.set(level, []);

                map.get(level).push(zone);
            });

        return [...map.entries()].sort(([a], [b]) => a - b);
    }, [zones]);


    const viewBox = useMemo(() => {
        if (zones.length === 0) {
            return `0 0 ${canvasWidth} ${canvasHeight}`;
        }

        const padding = 30;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        zones.forEach((zone) => {
            const x = Number(zone.posX) || 0;
            const y = Number(zone.posY) || 0;
            const w = Number(zone.width) || 120;
            const h = Number(zone.height) || 60;

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
        });

        const boxWidth = Math.max(maxX - minX, 1);
        const boxHeight = Math.max(maxY - minY, 1);

        return [
            minX - padding,
            minY - padding,
            boxWidth + padding * 2,
            boxHeight + padding * 2,
        ].join(" ");
    }, [zones, canvasWidth, canvasHeight]);

    if (zones.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-gray-400">
                <p className="text-sm font-medium text-gray-500">
                    Sơ đồ ghế chưa có khu vực nào
                </p>
            </div>
        );
    }

    return (
        <div
            className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`}
        >
            <svg
                viewBox={viewBox}
                className="block h-auto w-full"
                role="img"
                aria-label="Sơ đồ ghế"
            >
                {levels.map(([level, levelZones]) =>
                    levelZones.map((zone) => {
                        const width = Number(zone.width) || 120;
                        const height = Number(zone.height) || 60;
                        const posX = Number(zone.posX) || 0;
                        const posY = Number(zone.posY) || 0;
                        const rotation = Number(zone.rotation) || 0;
                        const color = zone.color || "#3b82f6";
                        const isStage = zone.type === "STAGE";

                        const shape = buildShape({
                            shape: zone.shape,
                            width,
                            height,
                            points: zone.points,
                            holes: zone.holes,
                        });

                        const cx = posX + width / 2;
                        const cy = posY + height / 2;

                        // Lật gương: đảo toạ độ quanh tâm khối.
                        const flipTransform = [
                            zone.flipX
                                ? `translate(${cx * 2} 0) scale(-1 1)`
                                : "",
                            zone.flipY
                                ? `translate(0 ${cy * 2}) scale(1 -1)`
                                : "",
                        ]
                            .filter(Boolean)
                            .join(" ");

                        const capacity =
                            zone.type === "SEATED"
                                ? Math.max(
                                      0,
                                      (Number(zone.rowCount) || 0) *
                                          (Number(zone.seatPerRow) || 0) -
                                          (zone.removedSeats?.length || 0) -
                                          (zone.blockedSeats?.length || 0)
                                  )
                                : Number(zone.capacity) || 0;

                        /**
                         * Lưới ghế + khung bao của các ô CÒN LẠI.
                         * Xoá ghế ở rìa ngoài cùng -> đường bao ngoài của
                         * khu vực co lại đúng chỗ; khôi phục ghế -> nở lại.
                         *
                         * Dùng chung hàm lõi với canvas Konva để hai
                         * nơi luôn hiển thị giống nhau.
                         */
                        const seatLayout =
                            zone.type === "SEATED"
                                ? buildSeatCells({
                                      rowCount: zone.rowCount,
                                      seatPerRow: zone.seatPerRow,
                                      width,
                                      height,
                                      removedSeats: zone.removedSeats,
                                      blockedSeats: zone.blockedSeats,
                                      gap: SEAT_GAP,
                                  })
                                : null;

                        const seatRects = seatLayout?.cells || [];
                        const seatContentBounds =
                            seatLayout?.contentBounds || null;

                        const hasRemovedSeats =
                            Array.isArray(zone.removedSeats) &&
                            zone.removedSeats.length > 0;

                        const clipShape =
                            hasRemovedSeats && seatContentBounds
                                ? `inset(${seatContentBounds.y}px ${Math.max(
                                      0,
                                      width -
                                          seatContentBounds.x -
                                          seatContentBounds.width
                                  )}px ${Math.max(
                                      0,
                                      height -
                                          seatContentBounds.y -
                                          seatContentBounds.height
                                  )}px ${seatContentBounds.x}px)`
                                : undefined;

                        const transform = [
                            rotation
                                ? `rotate(${rotation} ${cx} ${cy})`
                                : "",
                            flipTransform,
                        ]
                            .filter(Boolean)
                            .join(" ");

                        // Id của vùng cắt (clip) cho khu vực này.
                        const clipId = `seat-clip-${zone.id}`;

                        return (
                            <g
                                key={zone.id}
                                transform={
                                    transform || undefined
                                }
                            >
                                {/* Cắt đường bao khu vực theo các ghế còn lại */}
                                {clipShape && (
                                    <defs>
                                        <clipPath
                                            id={clipId}
                                            clipPathUnits="userSpaceOnUse"
                                        >
                                            <rect
                                                x={
                                                    posX +
                                                    seatContentBounds.x
                                                }
                                                y={
                                                    posY +
                                                    seatContentBounds.y
                                                }
                                                width={
                                                    seatContentBounds.width
                                                }
                                                height={
                                                    seatContentBounds.height
                                                }
                                            />
                                        </clipPath>
                                    </defs>
                                )}

                                <g
                                    clipPath={
                                        clipShape
                                            ? `url(#${clipId})`
                                            : undefined
                                    }
                                >
                                {shape.holes?.length ? (
                                    <path
                                        d={buildShapePath(shape, {
                                            x: posX,
                                            y: posY,
                                        })}
                                        fillRule="evenodd"
                                        fill={color}
                                        fillOpacity={0.85}
                                        stroke="rgba(255,255,255,0.9)"
                                        strokeWidth={2}
                                    />
                                ) : (
                                    <>
                                        {shape.tag === "rect" && (
                                            <rect
                                                x={posX + shape.x}
                                                y={posY + shape.y}
                                                width={shape.width}
                                                height={shape.height}
                                                rx={shape.rx}
                                                ry={shape.ry}
                                                fill={color}
                                                fillOpacity={0.85}
                                                stroke="rgba(255,255,255,0.9)"
                                                strokeWidth={2}
                                            />
                                        )}

                                        {shape.tag === "ellipse" && (
                                            <ellipse
                                                cx={posX + shape.cx}
                                                cy={posY + shape.cy}
                                                rx={shape.rx}
                                                ry={shape.ry}
                                                fill={color}
                                                fillOpacity={0.85}
                                                stroke="rgba(255,255,255,0.9)"
                                                strokeWidth={2}
                                            />
                                        )}

                                        {shape.tag === "polygon" && (
                                            <polygon
                                                points={toPointsString(
                                                    shape.points.map(
                                                        ([x, y]) => [
                                                            posX + x,
                                                            posY + y,
                                                        ]
                                                    )
                                                )}
                                                fill={color}
                                                fillOpacity={0.85}
                                                stroke="rgba(255,255,255,0.9)"
                                                strokeWidth={2}
                                            />
                                        )}
                                    </>
                                )}
                                </g>

                                {/* Lưới ghế bên trong khu vực */}
                                {seatRects.map((cell) => (
                                    <rect
                                        key={cell.key}
                                        x={posX + cell.x}
                                        y={posY + cell.y}
                                        width={cell.width}
                                        height={cell.height}
                                        rx={Math.min(
                                            3,
                                            cell.width / 4,
                                            cell.height / 4
                                        )}
                                        fill={
                                            cell.blocked
                                                ? "#0f172a"
                                                : "#ffffff"
                                        }
                                        fillOpacity={
                                            cell.blocked ? 0.45 : 0.35
                                        }
                                        stroke="rgba(255,255,255,0.75)"
                                        strokeWidth={1}
                                    />
                                ))}

                                <text
                                    x={cx}
                                    y={cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="pointer-events-none select-none"
                                    fill="#ffffff"
                                    fontSize={13}
                                    fontWeight={600}
                                    style={{
                                        paintOrder: "stroke",
                                        stroke: "rgba(0,0,0,0.45)",
                                        strokeWidth: 3,
                                    }}
                                >
                                    {truncate(zone.name)}
                                </text>

                                {/* Capacity */}
                                {!isStage && (
                                    <text
                                        x={cx}
                                        y={cy + 17}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="pointer-events-none select-none"
                                        fill="#ffffff"
                                        fillOpacity={0.9}
                                        fontSize={11}
                                        fontWeight={500}
                                        style={{
                                            paintOrder: "stroke",
                                            stroke: "rgba(0,0,0,0.35)",
                                            strokeWidth: 3,
                                        }}
                                    >
                                        {capacity} chỗ
                                    </text>
                                )}

                                {isStage && (
                                    <text
                                        x={cx}
                                        y={cy + 17}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="pointer-events-none select-none"
                                        fill="#ffffff"
                                        fillOpacity={0.9}
                                        fontSize={11}
                                        fontWeight={500}
                                        style={{
                                            paintOrder: "stroke",
                                            stroke: "rgba(0,0,0,0.35)",
                                            strokeWidth: 3,
                                        }}
                                    >
                                        {ZONE_TYPE_LABEL.STAGE}
                                    </text>
                                )}
                            </g>
                        );
                    })
                )}
            </svg>
        </div>
    );
}