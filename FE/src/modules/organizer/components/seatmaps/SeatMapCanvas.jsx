import {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Move, RotateCw, Trash2, Lock, Unlock } from "lucide-react";

import { ZoneShape } from "./zoneShapes";
import {
    GRID_SIZE,
    MIN_ZONE_SIZE,
    ZONE_TYPE_LABEL,
    snapToGrid,
} from "./seatmapConstants";
import { getSelectionBounds } from "./canvasGeometry";
import { getResizeCursor } from "./resizeCursor";
import { buildSeatLayout } from "./seatGridUtils";
import {
    getGroupCenter,
    rotateGroup,
    scaleGroup,
} from "./groupTransform";

const CanvasZone = memo(function CanvasZone({
    zone,
    isSelected,
    isDragging = false,
    hideHandles = false,
    seatTool = "none",
    onPointerDown,
    onResizeStart,
    onRotateStart,
    onDelete,
    onPointChange,
    onSeatCellClick,
    onToggleLock,
}) {
    const capacity =
        zone.type === "SEATED"
            ? (zone.rowCount || 0) * (zone.seatPerRow || 0)
            : zone.capacity;

    // Vị trí bấm chuột lần cuối trên ô ghế - dùng để phân biệt
    // "bấm để khoá/xoá ghế" với "kéo khu vực".
    const pointerStartRef = useRef(null);

    // 4 tay nắm dãn ở 4 góc.
    const resizeHandles = [
        { id: "nw", style: { left: 0, top: 0 } },
        { id: "ne", style: { right: 0, top: 0 } },
        { id: "sw", style: { left: 0, bottom: 0 } },
        { id: "se", style: { right: 0, bottom: 0 } },
    ];

    // 4 tay nắm dãn ở giữa mỗi cạnh (giống Figma) - kéo theo 1 trục.
    const edgeHandles = [
        { id: "n", style: { left: "50%", top: 0 } },
        { id: "s", style: { left: "50%", bottom: 0 } },
        { id: "w", style: { left: 0, top: "50%" } },
        { id: "e", style: { right: 0, top: "50%" } },
    ];

    const zoneRotation = zone.rotation || 0;

    const seatRows = Math.max(0, Number(zone.rowCount) || 0);
    const seatCols = Math.max(0, Number(zone.seatPerRow) || 0);

    const seatLayout = useMemo(() => {
        if (zone.type !== "SEATED") return null;

        if (seatRows === 0 || seatCols === 0) return null;

        return buildSeatLayout({
            rowCount: seatRows,
            seatPerRow: seatCols,
            width: zone.width,
            height: zone.height,
            removedSeats: zone.removedSeats,
            blockedSeats: zone.blockedSeats,
        });
    }, [
        zone.type,
        zone.width,
        zone.height,
        zone.removedSeats,
        zone.blockedSeats,
        seatRows,
        seatCols,
    ]);

    const seatCells = seatLayout?.cells || [];
    const removedSeatCells = seatLayout?.removedCells || [];

    const seatClipBounds = seatLayout?.contentBounds || null;

    // Khi có ghế bị xoá, đường bao zone được cắt theo khung còn lại.
    const hasRemovedSeats = removedSeatCells.length > 0;

    const labelBounds =
        hasRemovedSeats && seatClipBounds
            ? seatClipBounds
            : {
                x: 0,
                y: 0,
                width: zone.width,
                height: zone.height,
            };

    const clipStyle = hasRemovedSeats && seatClipBounds
        ? {
            clipPath: `inset(${seatClipBounds.y}px ${Math.max(
                0,
                (zone.width || 0) -
                seatClipBounds.x -
                seatClipBounds.width
            )}px ${Math.max(
                0,
                (zone.height || 0) -
                seatClipBounds.y -
                seatClipBounds.height
            )}px ${seatClipBounds.x}px)`,
        }
        : undefined;

    const showPoints =
        isSelected &&
        zone.shape === "POLYGON" &&
        Array.isArray(zone.points) &&
        zone.points.length >= 3;

    // Lật gương: scale âm theo trục.
    const flipTransform = [
        zone.flipX ? "scaleX(-1)" : "",
        zone.flipY ? "scaleY(-1)" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            data-zone-id={zone.id}
            className={`absolute select-none ${isSelected ? "z-10" : "z-0"
                } ${isDragging ? "opacity-80" : ""}`}
            style={{
                left: zone.posX,
                top: zone.posY,
                width: zone.width,
                height: zone.height,
                transform: [
                    zone.rotation
                        ? `rotate(${zone.rotation}deg)`
                        : "",
                    flipTransform,
                ]
                    .filter(Boolean)
                    .join(" "),
                transformOrigin: "center center",
                zIndex: zone.zIndex || 0,
            }}
        >
            {/* Khối hình - bấm/kéo ở đây để di chuyển */}
            <div
                onPointerDown={(event) =>
                    onPointerDown?.(event, zone)
                }
                className="cursor-grab active:cursor-grabbing"
            >
                <div
                    className="absolute inset-0"
                    style={clipStyle}
                >
                    <ZoneShape
                        shape={zone.shape}
                        width={zone.width}
                        height={zone.height}
                        points={zone.points}
                        holes={zone.holes}
                        color={zone.color || "#3b82f6"}
                        stroke={
                            isSelected
                                ? "#1d4ed8"
                                : "rgba(255,255,255,0.85)"
                        }
                        strokeWidth={isSelected ? 3 : 2}
                        className="absolute inset-0 overflow-visible"
                    />
                </div>

                {hasRemovedSeats && seatClipBounds && (
                    <div
                        className="pointer-events-none absolute rounded-[4px]"
                        style={{
                            left: seatClipBounds.x,
                            top: seatClipBounds.y,
                            width: seatClipBounds.width,
                            height: seatClipBounds.height,
                            border: `${isSelected ? 3 : 2}px solid ${isSelected
                                ? "#1d4ed8"
                                : "rgba(255,255,255,0.85)"
                                }`,
                        }}
                    />
                )}

                {(seatCells.length > 0 || removedSeatCells.length > 0) && (
                    <div
                        className="absolute inset-0"
                        style={{
                            pointerEvents:
                                seatTool === "none"
                                    ? "none"
                                    : "auto",
                            userSelect: "none",
                            touchAction: "none",
                        }}
                    >
                        {seatCells.map((cell) => (
                            <button
                                key={cell.key}
                                type="button"
                                title={
                                    cell.blocked
                                        ? `Ghế ${cell.rowLabel}-${cell.seatNumber} đang bị khoá`
                                        : `Ghế ${cell.rowLabel}-${cell.seatNumber}`
                                }
                                onPointerDown={(event) => {
                                    event.__vtSeatCell = true;

                                    pointerStartRef.current = {
                                        x: event.clientX,
                                        y: event.clientY,
                                    };
                                }}
                                onClick={(event) => {
                                    event.stopPropagation();

                                    const start =
                                        pointerStartRef.current;

                                    pointerStartRef.current = null;

                                    if (
                                        start &&
                                        (Math.abs(
                                            event.clientX - start.x
                                        ) > 3 ||
                                            Math.abs(
                                                event.clientY - start.y
                                            ) > 3)
                                    ) {
                                        return;
                                    }

                                    onSeatCellClick?.(zone, cell);
                                }}
                                className={`absolute rounded-[3px] border border-white/70 transition ${seatTool === "none"
                                    ? "pointer-events-none cursor-default"
                                    : seatTool === "block"
                                        ? "cursor-pointer hover:border-amber-400"
                                        : "cursor-pointer hover:border-red-400"
                                    }`}
                                style={{
                                    left: cell.x,
                                    top: cell.y,
                                    width: cell.size,
                                    height: cell.size,
                                    backgroundColor: cell.blocked
                                        ? "rgba(15,23,42,0.55)"
                                        : "rgba(255,255,255,0.28)",
                                }}
                            />
                        ))}

                        {/* Ô đã bị xoá: vẽ nét đứt để bấm khôi phục được */}
                        {removedSeatCells.map((cell) => (
                            <button
                                key={cell.key}
                                type="button"
                                title={`Ô ${cell.rowLabel}-${cell.seatNumber} đã bị xoá (bấm để khôi phục)`}
                                onPointerDown={(event) => {
                                    event.__vtSeatCell = true;

                                    pointerStartRef.current = {
                                        x: event.clientX,
                                        y: event.clientY,
                                    };
                                }}
                                onClick={(event) => {
                                    event.stopPropagation();

                                    const start =
                                        pointerStartRef.current;

                                    pointerStartRef.current = null;

                                    if (
                                        start &&
                                        (Math.abs(
                                            event.clientX - start.x
                                        ) > 3 ||
                                            Math.abs(
                                                event.clientY - start.y
                                            ) > 3)
                                    ) {
                                        return;
                                    }

                                    onSeatCellClick?.(zone, cell);
                                }}
                                className={`absolute rounded-[3px] border border-dashed transition ${seatTool === "none"
                                    ? "pointer-events-none cursor-default border-white/30"
                                    : "cursor-pointer border-red-300/70 hover:border-red-500 hover:bg-red-500/20"
                                    }`}
                                style={{
                                    left: cell.x,
                                    top: cell.y,
                                    width: cell.size,
                                    height: cell.size,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Tay nắm chỉnh đỉnh đa giác (chữ T/U/L...) */}
            {showPoints &&
                zone.points.map((point, index) => (
                    <div
                        key={index}
                        onPointerDown={(event) =>
                            onPointChange?.(event, zone, index)
                        }
                        title="Kéo để chỉnh đỉnh"
                        className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-white bg-amber-500 shadow"
                        style={{
                            left: point.x,
                            top: point.y,
                        }}
                    />
                ))}

            {/* Tên + số chỗ: căn giữa vùng còn lại sau khi cắt */}
            <div
                className="pointer-events-none absolute flex flex-col items-center justify-center gap-0.5 overflow-hidden px-2 text-center"
                style={{
                    left: labelBounds.x,
                    top: labelBounds.y,
                    width: labelBounds.width,
                    height: labelBounds.height,
                }}
            >
                <span className="line-clamp-2 max-w-full text-[11px] font-semibold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                    {zone.name}
                </span>

                {zone.type !== "STAGE" && (
                    <span className="rounded bg-black/25 px-1 text-[9px] font-semibold text-white">
                        {capacity} chỗ
                    </span>
                )}
            </div>

            {/* Badge loại khu vực */}
            {isSelected && (
                <div className="pointer-events-none absolute -top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    <RotateCw size={9} />
                    {ZONE_TYPE_LABEL[zone.type] || zone.type}
                </div>
            )}

            {/* Tay nắm xoay - trên đỉnh khối */}
            {isSelected && !hideHandles && (
                <div
                    onPointerDown={(event) =>
                        onRotateStart?.(event, zone)
                    }
                    title="Kéo để xoay (giữ Shift để khóa góc 15°)"
                    className="absolute -top-6 left-1/2 h-3 w-3 -translate-x-1/2 cursor-grab rounded-full border-2 border-white bg-blue-600 shadow active:cursor-grabbing"
                />
            )}

            {/* Tay nắm dãn ở 4 góc */}
            {isSelected &&
                !hideHandles &&
                resizeHandles.map((handle) => (
                    <div
                        key={handle.id}
                        onPointerDown={(event) =>
                            onResizeStart?.(event, zone, handle.id)
                        }
                        title="Kéo để thay đổi kích thước"
                        className="absolute h-3 w-3 rounded-full border-2 border-white bg-blue-600 shadow"
                        style={{
                            ...handle.style,
                            transform: "translate(-50%, -50%)",
                            cursor: getResizeCursor(
                                handle.id,
                                zoneRotation
                            ),
                        }}
                    />
                ))}

            {/* Tay nắm dãn ở giữa 4 cạnh (giống Figma) */}
            {isSelected &&
                !hideHandles &&
                edgeHandles.map((handle) => (
                    <div
                        key={handle.id}
                        onPointerDown={(event) =>
                            onResizeStart?.(event, zone, handle.id)
                        }
                        title="Kéo để thay đổi kích thước"
                        className="absolute h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500 shadow"
                        style={{
                            ...handle.style,
                            transform: "translate(-50%, -50%)",
                            cursor: getResizeCursor(
                                handle.id,
                                zoneRotation
                            ),
                        }}
                    />
                ))}

            {/* Nút khóa / mở khóa Zone */}
            {isSelected && (
                <button
                    type="button"
                    onPointerDown={(event) => {
                        event.stopPropagation();
                    }}
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggleLock?.(zone.id);
                    }}
                    title={zone.isLocked ? "Mở khóa khu vực" : "Khóa khu vực"}
                    className={`absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-white shadow transition ${zone.isLocked
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-gray-600 hover:bg-gray-700"
                        }`}
                >
                    {zone.isLocked ? <Lock size={11} /> : <Unlock size={11} />}
                </button>
            )}

            {/* Nút xóa trực tiếp trên canvas */}
            {isSelected && (
                <button
                    type="button"
                    onPointerDown={(event) => {
                        event.stopPropagation();
                    }}
                    onClick={(event) => {
                        event.stopPropagation();
                        onDelete?.(zone.id);
                    }}
                    title="Xóa khu vực này"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-white shadow transition hover:bg-red-600"
                >
                    <Trash2 size={12} />
                </button>
            )}
        </div>
    );
});

function useCanvasTransform({
    zones = [],
    onSelectZone,
    onUpdateZone,
    onUpdateZones,
    onBeforeDrag,
    canvasRef,
    scale = 1,
    canvasWidth = 900,
    canvasHeight = 600,
    gridSize = GRID_SIZE,
}) {
    const [drag, setDrag] = useState(null);
    const zonesRef = useRef(zones);
    const dragRef = useRef(null);

    useLayoutEffect(() => {
        zonesRef.current = zones;
    }, [zones]);

    // Lịch render khi kéo: gom nhiều event pointermove vào 1 khung hình
    // để tránh render lại quá nhiều lần -> mượt hơn nhiều.
    const frameRef = useRef(null);
    const pendingEventRef = useRef(null);

    /**
     * Di chuyển khối NGAY trên DOM (không qua React state) trong lúc kéo.
     *
     * Đây là kỹ thuật giống Figma/Penpot: trong lúc kéo chỉ cập nhật
     * style.left / style.top trực tiếp, không re-render. Khi thả chuột
     * mới commit vị trí cuối cùng vào state.
     *
     * Nhờ vậy kéo rất mượt, không bị giật dù có rất nhiều khu vực.
     */
    const previewPositions = useCallback((positions) => {
        const canvasEl = canvasRef.current;

        if (!canvasEl) return;

        Object.entries(positions).forEach(([id, pos]) => {
            const el = canvasEl.querySelector(
                `[data-zone-id="${id}"]`
            );

            if (!el) return;

            el.style.left = `${pos.posX}px`;
            el.style.top = `${pos.posY}px`;
        });
    }, [canvasRef]);

    const commitPositions = useCallback(
        (ids, positions) => {
            if (!ids?.length || !positions) return;

            const patches = {};

            ids.forEach((id) => {
                const pos = positions[id];

                if (!pos) return;

                patches[id] = {
                    posX: pos.posX,
                    posY: pos.posY,
                };
            });

            if (Object.keys(patches).length === 0) return;
            onUpdateZones?.(patches);
        },
        [onUpdateZones]
    );

    const beginDrag = useCallback((payload) => {
        dragRef.current = payload;
        setDrag(payload);
    }, []);

    /** Chuyển toạ độ chuột thành toạ độ trên canvas (đã chia scale). */
    const toCanvasPoint = useCallback(
        (event) => {
            const rect = canvasRef.current?.getBoundingClientRect();

            if (!rect) return { x: 0, y: 0 };

            return {
                x: (event.clientX - rect.left) / scale,
                y: (event.clientY - rect.top) / scale,
            };
        },
        [canvasRef, scale]
    );

    const resolveMoveTargets = useCallback(
        (zone, selectedIds = []) => {
            const ids = new Set();

            if (zone.groupId) {
                zonesRef.current.forEach((item) => {
                    if (
                        item.groupId === zone.groupId &&
                        !item.isLocked
                    ) {
                        ids.add(item.id);
                    }
                });
            } else if (selectedIds.includes(zone.id)) {
                selectedIds.forEach((id) => {
                    const item = zonesRef.current.find(
                        (zoneItem) => zoneItem.id === id
                    );

                    if (item && !item.isLocked) {
                        ids.add(id);
                    }
                });
            } else if (!zone.isLocked) {
                ids.add(zone.id);
            }

            return [...ids];
        },
        []
    );

    const resolveGroupMembers = useCallback((zone) => {
        if (!zone?.groupId) return null;

        const members = zonesRef.current.filter(
            (item) =>
                item.groupId === zone.groupId &&
                !item.isLocked
        );

        return members.length > 1 ? members : null;
    }, []);

    const resolveTransformMembers = useCallback(
        (zone) => resolveGroupMembers(zone),
        [resolveGroupMembers]
    );

    const startMove = useCallback(
        (event, zone, selectedIds = []) => {
            event.stopPropagation();

            // Nếu bấm xuất phát từ ô ghế -> không preventDefault để
            // sự kiện click vẫn được fire (khoá/xoá ghế).
            if (!event.__vtSeatCell) {
                event.preventDefault();
            }

            // Shift/Ctrl -> thêm/bớt vào vùng chọn thay vì thay thế.
            const additive =
                event.shiftKey || event.ctrlKey || event.metaKey;

            onSelectZone?.(zone.id, { additive });

            // Zone đã khóa vẫn được chọn nhưng không được di chuyển.
            if (zone.isLocked) return;

            // Ghi lịch sử trước khi kéo để undo về đúng vị trí cũ.
            onBeforeDrag?.(zonesRef.current);

            const point = toCanvasPoint(event);

            const targetIds = resolveMoveTargets(
                zone,
                selectedIds
            );

            const origins = {};

            targetIds.forEach((id) => {
                const target = zonesRef.current.find(
                    (z) => z.id === id
                );

                if (target) {
                    origins[id] = {
                        posX: target.posX,
                        posY: target.posY,
                        width: target.width,
                        height: target.height,
                    };
                }
            });

            beginDrag({
                mode: "move",
                zoneId: zone.id,
                targetIds,
                origins,
                // Vị trí gốc của zone đang kéo (mốc để tính delta).
                startPosX: zone.posX,
                startPosY: zone.posY,
                offsetX: point.x - zone.posX,
                offsetY: point.y - zone.posY,
                // Vị trí tạm trong lúc kéo (commit khi thả chuột).
                positions: null,
            });
        },
        [
            onSelectZone,
            onBeforeDrag,
            toCanvasPoint,
            resolveMoveTargets,
            beginDrag,
        ]
    );

    const startResize = useCallback(
        (event, zone, handle) => {
            event.stopPropagation();
            event.preventDefault();
            if (zone.isLocked) return;

            onBeforeDrag?.(zonesRef.current);

            const point = toCanvasPoint(event);

            // Nếu zone thuộc nhóm -> dãn cả nhóm.
            const members = resolveTransformMembers(zone);

            if (members) {
                // Giữ nguyên vùng chọn hiện tại (không thu lại về 1 zone).
                const center = getGroupCenter(members);

                // Hộp bao trọn của nhóm (dùng tính tỉ lệ).
                const groupBounds = getSelectionBounds(members);

                // Điểm neo: góc / cạnh đối diện với tay nắm đang kéo
                // (giống Figma - kéo góc SE thì góc NW đứng yên).
                const anchor = {
                    x: groupBounds.x,
                    y: groupBounds.y,
                };

                if (handle.includes("e")) {
                    anchor.x = groupBounds.right;
                }

                if (handle.includes("s")) {
                    anchor.y = groupBounds.bottom;
                }

                beginDrag({
                    mode: "resizeGroup",
                    zoneId: zone.id,
                    handle,
                    startPoint: point,
                    center,
                    anchor,
                    // Kích thước & vị trí gốc của từng thành viên.
                    origins: members.map((member) => ({
                        id: member.id,
                        posX: member.posX,
                        posY: member.posY,
                        width: member.width,
                        height: member.height,
                        rotation: member.rotation || 0,
                        shape: member.shape,
                        points: Array.isArray(member.points)
                            ? member.points.map((p) => ({ ...p }))
                            : null,
                        holes: Array.isArray(member.holes)
                            ? member.holes.map((ring) =>
                                ring.map((p) => ({ ...p }))
                            )
                            : null,
                    })),
                    groupBounds,
                });

                return;
            }

            // Chỉ 1 zone -> chọn zone đó rồi dãn riêng.
            onSelectZone?.(zone.id);

            beginDrag({
                mode: "resize",
                zoneId: zone.id,
                handle,
                startPoint: point,
                // Góc xoay lúc bắt đầu kéo - dùng để tính delta
                // theo hệ toạ độ cục bộ của shape (giống Figma).
                startRotation: zone.rotation || 0,
                startBounds: {
                    posX: zone.posX,
                    posY: zone.posY,
                    width: zone.width,
                    height: zone.height,
                },
                // Đỉnh gốc của đa giác lúc bắt đầu kéo - dùng làm gốc
                // scale để tránh biến dạng dần theo mỗi frame.
                startPoints: Array.isArray(zone.points)
                    ? zone.points.map((p) => ({ ...p }))
                    : null,
                startHoles: Array.isArray(zone.holes)
                    ? zone.holes.map((ring) =>
                        ring.map((p) => ({ ...p }))
                    )
                    : null,
            });
        },
        [
            onSelectZone,
            onBeforeDrag,
            toCanvasPoint,
            beginDrag,
            resolveTransformMembers,
        ]
    );

    const startRotate = useCallback(
        (event, zone) => {
            event.stopPropagation();
            event.preventDefault();
            if (zone.isLocked) return;

            onBeforeDrag?.(zonesRef.current);

            const point = toCanvasPoint(event);

            // Nếu zone thuộc nhóm -> xoay cả nhóm.
            const members = resolveTransformMembers(zone);

            if (members) {
                const center = getGroupCenter(members);

                beginDrag({
                    mode: "rotateGroup",
                    zoneId: zone.id,
                    center,
                    startAngle:
                        (Math.atan2(
                            point.y - center.y,
                            point.x - center.x
                        ) *
                            180) /
                        Math.PI,
                    // Góc xoay ban đầu của từng thành viên.
                    origins: members.map((member) => ({
                        id: member.id,
                        rotation: member.rotation || 0,
                        posX: member.posX,
                        posY: member.posY,
                        width: member.width,
                        height: member.height,
                    })),
                });

                return;
            }

            // Chỉ 1 zone -> chọn zone đó rồi xoay riêng.
            onSelectZone?.(zone.id);

            // Tâm xoay = giữa khối.
            const centerX = zone.posX + zone.width / 2;
            const centerY = zone.posY + zone.height / 2;

            beginDrag({
                mode: "rotate",
                zoneId: zone.id,
                center: { x: centerX, y: centerY },
                startAngle:
                    (Math.atan2(
                        point.y - centerY,
                        point.x - centerX
                    ) *
                        180) /
                    Math.PI,
                startRotation: zone.rotation || 0,
            });
        },
        [
            onSelectZone,
            onBeforeDrag,
            toCanvasPoint,
            beginDrag,
            resolveTransformMembers,
        ]
    );

    // Bắt đầu kéo một đỉnh của đa giác (chỉnh hình chữ T/U/L).
    const startPointDrag = useCallback(
        (event, zone, pointIndex) => {
            event.stopPropagation();
            event.preventDefault();
            if (zone.isLocked) return;

            onSelectZone?.(zone.id);

            onBeforeDrag?.(zonesRef.current);

            const point = toCanvasPoint(event);

            const vertices = Array.isArray(zone.points)
                ? zone.points
                : [];

            const vertex = vertices[pointIndex];

            if (!vertex) return;

            beginDrag({
                mode: "point",
                zoneId: zone.id,
                pointIndex,
                // Gốc toạ độ của zone trên canvas.
                originX: zone.posX,
                originY: zone.posY,
                // Toạ độ chuột & toạ độ đỉnh lúc BẮT ĐẦU kéo.
                // Dùng làm mốc để tính vị trí tuyệt đối của đỉnh,
                // tránh cộng dồn từng frame (gây trễ & giật).
                startPoint: point,
                startVertex: { x: vertex.x, y: vertex.y },
                start: point,
            });
        },
        [onSelectZone, onBeforeDrag, toCanvasPoint, beginDrag]
    );

    useEffect(() => {
        const applyPointerMove = (event) => {
            const current = dragRef.current;

            if (!current) return;

            const zone = zonesRef.current.find(
                (z) => z.id === current.zoneId
            );

            if (!zone) return;

            const point = toCanvasPoint(event);

            // ---- Chỉnh đỉnh đa giác ----
            if (current.mode === "point") {
                const points = Array.isArray(zone.points)
                    ? zone.points.map((p) => ({ ...p }))
                    : [];

                const currentPoint = points[current.pointIndex];

                if (!currentPoint) return;
                const nextX =
                    current.startVertex.x +
                    (point.x - current.startPoint.x);

                const nextY =
                    current.startVertex.y +
                    (point.y - current.startPoint.y);

                points[current.pointIndex] = {
                    x: Math.max(0, Math.min(nextX, zone.width)),
                    y: Math.max(0, Math.min(nextY, zone.height)),
                };

                onUpdateZone?.(zone.id, { points });

                return;
            }

            // ---- Di chuyển (có thể kéo cả nhóm / cả vùng chọn) ----
            if (current.mode === "move") {
                // Tính toạ độ đích từ vị trí GỐC lúc bắt đầu kéo.
                // Dùng mốc cố định (startPosX/startPosY)
                const maxX = canvasWidth - zone.width;
                const maxY = canvasHeight - zone.height;

                const clampedX = Math.max(
                    0,
                    Math.min(point.x - current.offsetX, maxX)
                );

                const clampedY = Math.max(
                    0,
                    Math.min(point.y - current.offsetY, maxY)
                );

                const snappedX = snapToGrid(clampedX, gridSize);
                const snappedY = snapToGrid(clampedY, gridSize);

                // Delta dùng chung cho mọi zone trong nhóm/vùng chọn.
                const deltaX = snappedX - current.startPosX;
                const deltaY = snappedY - current.startPosY;

                if (!current.targetIds?.length) {
                    onUpdateZone?.(zone.id, {
                        posX: snappedX,
                        posY: snappedY,
                    });

                    return;
                }

                const positions = {};

                current.targetIds.forEach((id) => {
                    const origin = current.origins?.[id];

                    if (!origin) return;

                    const posX = Math.max(
                        0,
                        Math.min(
                            origin.posX + deltaX,
                            canvasWidth - (origin.width ?? 0)
                        )
                    );

                    const posY = Math.max(
                        0,
                        Math.min(
                            origin.posY + deltaY,
                            canvasHeight - (origin.height ?? 0)
                        )
                    );

                    positions[id] = { posX, posY };
                });

                // Cập nhật trực tiếp trên DOM - KHÔNG re-render.
                previewPositions(positions);

                // Lưu vị trí tạm để commit khi thả chuột.
                current.positions = positions;

                return;
            }

            // ---- Dãn / co CẢ NHÓM ----
            if (current.mode === "resizeGroup") {
                const { handle, startPoint, center, origins } = current;

                let deltaX = point.x - startPoint.x;
                let deltaY = point.y - startPoint.y;

                const hasE = handle.includes("e");
                const hasS = handle.includes("s");
                const hasW = handle.includes("w");
                const hasN = handle.includes("n");

                // Tỉ lệ dãn của nhóm.
                const bounds = current.groupBounds;
                const anchor = current.anchor;

                let scaleX = 1;
                let scaleY = 1;

                if (hasE) {
                    scaleX =
                        (bounds.width + deltaX) / (bounds.width || 1);
                }

                if (hasW) {
                    scaleX =
                        (bounds.width - deltaX) / (bounds.width || 1);
                }

                if (hasS) {
                    scaleY =
                        (bounds.height + deltaY) / (bounds.height || 1);
                }

                if (hasN) {
                    scaleY =
                        (bounds.height - deltaY) / (bounds.height || 1);
                }

                // Giới hạn để nhóm không bị co quá nhỏ.
                scaleX = Math.max(0.1, scaleX);
                scaleY = Math.max(0.1, scaleY);

                // Giữ Shift: khoá tỉ lệ gốc cho cả nhóm.
                if (event.shiftKey) {
                    const useWidth =
                        Math.abs(scaleX - 1) >= Math.abs(scaleY - 1);

                    const ratio = useWidth ? scaleX : scaleY;

                    scaleX = ratio;
                    scaleY = ratio;
                }

                // Dựng lại các thành viên từ dữ liệu gốc (không cộng
                // dồn từng frame) rồi scale quanh điểm neo.
                const nextZones = scaleGroup(
                    origins.map((origin) => ({
                        id: origin.id,
                        posX: origin.posX,
                        posY: origin.posY,
                        width: origin.width,
                        height: origin.height,
                        rotation: origin.rotation,
                        shape: origin.shape,
                        points: origin.points,
                        holes: origin.holes,
                    })),
                    scaleX,
                    scaleY,
                    center,
                    anchor
                );

                const patches = {};

                nextZones.forEach((item) => {
                    patches[item.id] = {
                        posX: item.posX,
                        posY: item.posY,
                        width: item.width,
                        height: item.height,
                        ...(item.points ? { points: item.points } : {}),
                        ...(item.holes ? { holes: item.holes } : {}),
                    };
                });

                onUpdateZones?.(patches);

                return;
            }

            // ---- Xoay CẢ NHÓM ----
            if (current.mode === "rotateGroup") {
                const angle =
                    (Math.atan2(
                        point.y - current.center.y,
                        point.x - current.center.x
                    ) *
                        180) /
                    Math.PI;

                let delta = angle - current.startAngle;

                // Giữ Shift để khóa góc 15 độ.
                const stepped = event.shiftKey
                    ? Math.round(delta / 15) * 15
                    : Math.round(delta);

                // Dựng lại từ dữ liệu gốc rồi xoay quanh tâm nhóm.
                const nextZones = rotateGroup(
                    current.origins.map((origin) => ({
                        ...origin,
                    })),
                    stepped,
                    current.center
                );

                const patches = {};

                nextZones.forEach((item) => {
                    patches[item.id] = {
                        posX: item.posX,
                        posY: item.posY,
                        rotation: item.rotation,
                    };
                });

                onUpdateZones?.(patches);

                return;
            }

            // ---- Dãn / co ----
            if (current.mode === "resize") {
                const { handle, startPoint, startBounds } = current;
                const rotation = current.startRotation || 0;

                let deltaX = point.x - startPoint.x;
                let deltaY = point.y - startPoint.y;

                if (rotation) {
                    const rad = (-rotation * Math.PI) / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);

                    // Xoay ngược delta về hệ cục bộ của shape.
                    const localX = deltaX * cos - deltaY * sin;
                    const localY = deltaX * sin + deltaY * cos;

                    deltaX = localX;
                    deltaY = localY;
                }

                const { width: startW, height: startH } = startBounds;

                const hasE = handle.includes("e");
                const hasS = handle.includes("s");
                const hasW = handle.includes("w");
                const hasN = handle.includes("n");

                // ---- Kích thước mới ----
                let width = startW;
                let height = startH;

                if (hasE) {
                    width = Math.max(MIN_ZONE_SIZE, startW + deltaX);
                }

                if (hasW) {
                    width = Math.max(MIN_ZONE_SIZE, startW - deltaX);
                }

                if (hasS) {
                    height = Math.max(MIN_ZONE_SIZE, startH + deltaY);
                }

                if (hasN) {
                    height = Math.max(MIN_ZONE_SIZE, startH - deltaY);
                }

                const isCorner = hasE !== hasW && hasS !== hasN;
                // Chi phối tỉ lệ theo trục chính khi kéo góc (giữ Shift)
                if (event.shiftKey && isCorner) {
                    const useWidth =
                        Math.abs(deltaX) >= Math.abs(deltaY);

                    const ratio = useWidth
                        ? width / (startW || 1)
                        : height / (startH || 1);

                    width = Math.max(
                        MIN_ZONE_SIZE,
                        Math.round(startW * ratio)
                    );

                    height = Math.max(
                        MIN_ZONE_SIZE,
                        Math.round(startH * ratio)
                    );
                }

                const dw = width - startW;
                const dh = height - startH;

                let shiftLocalX = 0;
                let shiftLocalY = 0;

                if (hasE) shiftLocalX = dw / 2;
                if (hasW) shiftLocalX = -dw / 2;
                if (hasS) shiftLocalY = dh / 2;
                if (hasN) shiftLocalY = -dh / 2;

                // Giữ Alt: co giãn quanh tâm
                if (event.altKey) {
                    shiftLocalX = 0;
                    shiftLocalY = 0;

                    width = Math.max(
                        MIN_ZONE_SIZE,
                        Math.round(startW + dw * 2)
                    );

                    height = Math.max(
                        MIN_ZONE_SIZE,
                        Math.round(startH + dh * 2)
                    );
                }

                let shiftX = shiftLocalX;
                let shiftY = shiftLocalY;

                if (rotation) {
                    const rad = (rotation * Math.PI) / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);

                    shiftX = shiftLocalX * cos - shiftLocalY * sin;
                    shiftY = shiftLocalX * sin + shiftLocalY * cos;
                }

                let centerX = startBounds.posX + startW / 2 + shiftX;
                let centerY = startBounds.posY + startH / 2 + shiftY;

                // ---- Giới hạn trong canvas theo hộp bao quanh đã xoay ----
                const rad = (rotation * Math.PI) / 180;
                const absCos = Math.abs(Math.cos(rad));
                const absSin = Math.abs(Math.sin(rad));

                const bboxW = width * absCos + height * absSin;
                const bboxH = width * absSin + height * absCos;

                const halfW = bboxW / 2;
                const halfH = bboxH / 2;

                if (bboxW <= canvasWidth) {
                    centerX = Math.max(
                        halfW,
                        Math.min(centerX, canvasWidth - halfW)
                    );
                } else {
                    centerX = canvasWidth / 2;
                }

                if (bboxH <= canvasHeight) {
                    centerY = Math.max(
                        halfH,
                        Math.min(centerY, canvasHeight - halfH)
                    );
                } else {
                    centerY = canvasHeight / 2;
                }

                // Vị trí góc trên-trái của hộp (chưa xoay).
                const posX = centerX - width / 2;
                const posY = centerY - height / 2;

                const patch = {
                    posX: Math.round(posX),
                    posY: Math.round(posY),
                    width: Math.round(width),
                    height: Math.round(height),
                };

                // Đa giác: scale lại các đỉnh theo tỉ lệ kích thước mới
                // để hình không bị méo khi kéo giãn.
                if (
                    zone.shape === "POLYGON" &&
                    Array.isArray(current.startPoints) &&
                    current.startPoints.length >= 3
                ) {
                    const ratioX =
                        patch.width / (startBounds.width || 1);

                    const ratioY =
                        patch.height / (startBounds.height || 1);

                    patch.points = current.startPoints.map((p) => ({
                        x: Math.max(
                            0,
                            Math.min(p.x * ratioX, patch.width)
                        ),
                        y: Math.max(
                            0,
                            Math.min(p.y * ratioY, patch.height)
                        ),
                    }));

                    // Các lỗ (hình rỗng) cũng phải scale theo.
                    if (Array.isArray(current.startHoles)) {
                        patch.holes = current.startHoles.map((hole) =>
                            hole.map((p) => ({
                                x: Math.max(
                                    0,
                                    Math.min(p.x * ratioX, patch.width)
                                ),
                                y: Math.max(
                                    0,
                                    Math.min(p.y * ratioY, patch.height)
                                ),
                            }))
                        );
                    }
                }

                onUpdateZone?.(zone.id, patch);

                return;
            }

            // ---- Xoay ----
            if (current.mode === "rotate") {
                const angle =
                    (Math.atan2(
                        point.y - current.center.y,
                        point.x - current.center.x
                    ) *
                        180) /
                    Math.PI;

                let rotation =
                    current.startRotation +
                    (angle - current.startAngle);

                rotation = ((rotation + 180) % 360 + 360) % 360 - 180;

                // Giữ Shift để khóa góc 15 độ.
                const stepped = event.shiftKey
                    ? Math.round(rotation / 15) * 15
                    : Math.round(rotation);

                onUpdateZone?.(zone.id, { rotation: stepped });
            }
        };

        const handlePointerMove = (event) => {
            pendingEventRef.current = event;

            if (frameRef.current !== null) return;

            frameRef.current = window.requestAnimationFrame(() => {
                frameRef.current = null;

                const pending = pendingEventRef.current;

                pendingEventRef.current = null;

                if (pending) applyPointerMove(pending);
            });
        };

        const handlePointerUp = () => {
            // Huỷ khung hình đang chờ và áp dụng nốt event cuối.
            if (frameRef.current !== null) {
                window.cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }

            const pending = pendingEventRef.current;

            pendingEventRef.current = null;

            if (pending) applyPointerMove(pending);

            const current = dragRef.current;

            // Commit vị trí cuối cùng vào state (chỉ 1 lần khi thả).
            if (current?.mode === "move" && current.positions) {
                commitPositions(
                    current.targetIds,
                    current.positions
                );
            }

            dragRef.current = null;
            setDrag(null);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);

            if (frameRef.current !== null) {
                window.cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
        };
    }, [
        toCanvasPoint,
        canvasWidth,
        canvasHeight,
        gridSize,
        onUpdateZone,
        onUpdateZones,
        previewPositions,
        commitPositions,
    ]);

    return {
        drag,
        startMove,
        startResize,
        startRotate,
        startPointDrag,
    };
}

// ==================== CANVAS ====================

export default function SeatMapCanvas({
    zones = [],
    selectedZoneIds = [],
    onSelectZone,
    onSelectZonesInRect,
    onUpdateZone,
    onUpdateZones,
    onDeleteZone,
    onBeforeDrag,
    canvasWidth = 900,
    canvasHeight = 600,
    onCanvasClick,
    gridSize = GRID_SIZE,
    showGrid = true,
    seatTool = "none",
    onSeatCellClick,
}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [scale, setScale] = useState(1);

    // Vùng kéo chọn (marquee) đang được vẽ.
    const [marquee, setMarquee] = useState(null);

    // Ref giữ vùng kéo chọn hiện tại để listener không bị re-subscribe
    // mỗi lần chuột di chuyển (nếu không sẽ rơi sự kiện pointermove).
    const marqueeRef = useRef(null);

    // Throttle theo khung hình cho vùng kéo chọn (marquee).
    const marqueeFrameRef = useRef(null);
    const marqueeEventRef = useRef(null);

    // Tự co giãn canvas theo bề rộng khung chứa.
    useEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        const updateScale = () => {
            const available = container.clientWidth - 48;

            if (available <= 0) return;

            setScale(Math.min(1, available / canvasWidth));
        };

        updateScale();

        window.addEventListener("resize", updateScale);

        return () => window.removeEventListener("resize", updateScale);
    }, [canvasWidth]);

    const {
        drag,
        startMove,
        startResize,
        startRotate,
        startPointDrag,
    } = useCanvasTransform({
        zones,
        onSelectZone,
        onUpdateZone,
        onUpdateZones,
        onBeforeDrag,
        canvasRef,
        scale,
        canvasWidth,
        canvasHeight,
        gridSize,
    });

    // Chuyển toạ độ chuột -> toạ độ canvas.
    const toCanvasPoint = useCallback(
        (event) => {
            const rect = canvasRef.current?.getBoundingClientRect();

            if (!rect) return { x: 0, y: 0 };

            return {
                x: (event.clientX - rect.left) / scale,
                y: (event.clientY - rect.top) / scale,
            };
        },
        [scale]
    );

    // Bắt đầu kéo vùng chọn trên nền canvas.
    const startMarquee = useCallback(
        (event) => {
            if (event.button !== 0) return;

            const point = toCanvasPoint(event);

            const next = {
                startX: point.x,
                startY: point.y,
                x: point.x,
                y: point.y,
                additive:
                    event.shiftKey ||
                    event.ctrlKey ||
                    event.metaKey,
            };

            marqueeRef.current = next;

            setMarquee(next);
        },
        [toCanvasPoint]
    );

    // Theo dõi vùng kéo chọn.
    useEffect(() => {
        const handleMove = (event) => {
            marqueeEventRef.current = event;

            if (marqueeFrameRef.current !== null) return;

            marqueeFrameRef.current = window.requestAnimationFrame(
                () => {
                    marqueeFrameRef.current = null;

                    const pending = marqueeEventRef.current;

                    marqueeEventRef.current = null;

                    if (!pending) return;

                    const current = marqueeRef.current;

                    if (!current) return;

                    const point = toCanvasPoint(pending);

                    const next = {
                        ...current,
                        x: point.x,
                        y: point.y,
                    };

                    marqueeRef.current = next;

                    setMarquee(next);
                }
            );
        };

        const handleUp = () => {
            // Áp dụng nốt event cuối cùng trước khi kết thúc.
            if (marqueeFrameRef.current !== null) {
                window.cancelAnimationFrame(marqueeFrameRef.current);
                marqueeFrameRef.current = null;
            }

            const pending = marqueeEventRef.current;

            marqueeEventRef.current = null;

            if (pending) {
                const current = marqueeRef.current;

                if (current) {
                    const point = toCanvasPoint(pending);

                    marqueeRef.current = {
                        ...current,
                        x: point.x,
                        y: point.y,
                    };
                }
            }

            const current = marqueeRef.current;

            marqueeRef.current = null;

            setMarquee(null);

            if (!current) return;

            const rect = {
                x: Math.min(current.startX, current.x),
                y: Math.min(current.startY, current.y),
                width: Math.abs(current.x - current.startX),
                height: Math.abs(current.y - current.startY),
            };

            // Chỉ coi là chọn nhiều khi kéo đủ lớn.
            if (rect.width > 4 || rect.height > 4) {
                onSelectZonesInRect?.(rect, {
                    additive: current.additive,
                });
            } else if (!current.additive) {
                onSelectZone?.(null);
            }
        };

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);

        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);

            if (marqueeFrameRef.current !== null) {
                window.cancelAnimationFrame(marqueeFrameRef.current);
                marqueeFrameRef.current = null;
            }
        };
    }, [toCanvasPoint, onSelectZonesInRect, onSelectZone]);

    const selectedIdsRef = useRef(selectedZoneIds);

    useLayoutEffect(() => {
        selectedIdsRef.current = selectedZoneIds;
    }, [selectedZoneIds]);

    const handleToggleLock = useCallback(
        (zoneId) => {
            const zone = zones.find(
                (item) => item.id === zoneId
            );

            if (!zone) return;

            onUpdateZone?.(zoneId, {
                isLocked: !zone.isLocked,
            });
        },
        [zones, onUpdateZone]
    );

    const handleZonePointerDown = useCallback(
        (event, zone) => {
            startMove(event, zone, selectedIdsRef.current);
        },
        [startMove]
    );

    // Sắp xếp theo z-order để vẽ đúng thứ tự.
    const orderedZones = useMemo(
        () =>
            [...zones].sort(
                (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
            ),
        [zones]
    );

    // Khung bao vùng chọn).
    const selectedZones = useMemo(
        () =>
            zones.filter((zone) =>
                selectedZoneIds.includes(zone.id)
            ),
        [zones, selectedZoneIds]
    );

    const selectionBounds = useMemo(
        () => getSelectionBounds(selectedZones),
        [selectedZones]
    );

    const isMultiSelected = selectedZoneIds.length > 1;

    const groupId = useMemo(() => {
        if (selectedZoneIds.length === 0) return null;

        const selected = zones.filter(
            (item) =>
                selectedZoneIds.includes(item.id) &&
                !item.isLocked
        );

        if (selected.length === 0) return null;

        const ids = new Set(
            selected.map((item) => item.groupId || null)
        );

        if (ids.size !== 1) return null;

        const only = ids.values().next().value;

        return only || null;
    }, [zones, selectedZoneIds]);

    // Các thành viên của nhóm đang chọn.
    const groupMembers = useMemo(() => {
        if (!groupId) return [];

        return zones.filter(
            (item) =>
                item.groupId === groupId &&
                !item.isLocked
        );
    }, [zones, groupId]);

    // Hộp bao trọn của nhóm.
    const groupBounds = useMemo(() => {
        if (groupMembers.length < 2) return null;

        return getSelectionBounds(groupMembers);
    }, [groupMembers]);

    // Zone dùng làm "neo" cho tay nắm nhóm (xoay / dãn).
    const groupAnchorZone = useMemo(() => {
        if (groupMembers.length === 0) return null;

        return groupMembers[0];
    }, [groupMembers]);

    // 4 tay nắm dãn ở góc của khung nhóm.
    const groupResizeHandles = [
        { id: "nw", style: { left: 0, top: 0 } },
        { id: "ne", style: { right: 0, top: 0 } },
        { id: "sw", style: { left: 0, bottom: 0 } },
        { id: "se", style: { right: 0, bottom: 0 } },
    ];

    return (
        <div ref={containerRef} className="w-full">
            <div
                ref={canvasRef}
                data-canvas
                onPointerDown={startMarquee}
                onClick={() => onCanvasClick?.()}
                className="relative mx-auto rounded-lg border-2 border-dashed border-gray-300 bg-white shadow-inner"
                style={{
                    width: canvasWidth,
                    height: canvasHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: "top center",
                }}
            >
                {/* Lưới nền - đồng thời là mốc snap */}
                {showGrid && (
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
                            backgroundSize: `${gridSize}px ${gridSize}px`,
                        }}
                    />
                )}

                {/* Vùng trống */}
                {zones.length === 0 && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
                        <Move size={34} />
                        <p className="text-sm font-medium text-gray-400">
                            Tạo khu vực ở danh sách bên trái
                        </p>
                        <p className="text-xs text-gray-400">
                            rồi kéo thả vào canvas để đặt vị trí
                        </p>
                    </div>
                )}

                {/* Các khu vực */}
                {orderedZones.map((zone) => (
                    <CanvasZone
                        key={zone.id}
                        zone={zone}
                        isLocked={Boolean(zone.isLocked)}
                        onToggleLock={handleToggleLock}
                        isSelected={selectedZoneIds.includes(zone.id)}

                        hideHandles={Boolean(zone.isLocked) || Boolean(groupId)} seatTool={seatTool}
                        onSeatCellClick={onSeatCellClick}
                        isDragging={
                            drag?.zoneId === zone.id &&
                            drag?.mode === "move"
                        }
                        onPointerDown={handleZonePointerDown}
                        onResizeStart={startResize}
                        onRotateStart={startRotate}
                        onDelete={onDeleteZone}
                        onPointChange={startPointDrag}
                    />
                ))}

                {/* Khung nhóm: tay nắm xoay / dãn cho CẢ NHÓM */}
                {groupId && groupBounds && (
                    <div
                        className="pointer-events-none absolute border-2 border-dashed border-purple-500"
                        style={{
                            left: groupBounds.x,
                            top: groupBounds.y,
                            width: groupBounds.width,
                            height: groupBounds.height,
                            zIndex: 9997,
                        }}
                    >
                        {/* Tay nắm xoay nhóm */}
                        <div
                            onPointerDown={(event) =>
                                startRotate(
                                    event,
                                    groupAnchorZone
                                )
                            }
                            title="Kéo để xoay cả nhóm (giữ Shift để khóa góc 15°)"
                            className="pointer-events-auto absolute -top-7 left-1/2 h-3.5 w-3.5 -translate-x-1/2 cursor-grab rounded-full border-2 border-white bg-purple-600 shadow active:cursor-grabbing"
                        />

                        {/* Tay nắm dãn nhóm (4 góc) */}
                        {groupResizeHandles.map((handle) => (
                            <div
                                key={handle.id}
                                onPointerDown={(event) =>
                                    startResize(
                                        event,
                                        groupAnchorZone,
                                        handle.id
                                    )
                                }
                                title="Kéo để dãn cả nhóm"
                                className="pointer-events-auto absolute h-3 w-3 rounded-full border-2 border-white bg-purple-600 shadow"
                                style={{
                                    ...handle.style,
                                    transform: "translate(-50%, -50%)",
                                }}
                            />
                        ))}

                        <span className="absolute -top-5 right-0 rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            Nhóm {groupMembers.length} khu vực
                        </span>
                    </div>
                )}

                {isMultiSelected &&
                    !groupId &&
                    selectionBounds && (
                        <div
                            className="pointer-events-none absolute border-2 border-dashed border-blue-500"
                            style={{
                                left: selectionBounds.x,
                                top: selectionBounds.y,
                                width: selectionBounds.width,
                                height: selectionBounds.height,
                                zIndex: 9998,
                            }}
                        >
                            <span className="absolute -top-5 left-0 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {selectedZoneIds.length} khu vực - bấm
                                &quot;Gom nhóm&quot; để xoay/dãn cả khối
                            </span>
                        </div>
                    )}

                {marquee && (
                    <div
                        className="pointer-events-none absolute border border-blue-500 bg-blue-500/10"
                        style={{
                            left: Math.min(marquee.startX, marquee.x),
                            top: Math.min(marquee.startY, marquee.y),
                            width: Math.abs(marquee.x - marquee.startX),
                            height: Math.abs(marquee.y - marquee.startY),
                            zIndex: 9999,
                        }}
                    />
                )}
            </div>

            {/* Bù lề cho phần bị scale */}
            <div style={{ height: canvasHeight * scale }} />
        </div>
    );
}