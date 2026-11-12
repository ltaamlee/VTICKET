import { useCallback, useMemo, useRef } from "react";
import { Layer, Stage } from "react-konva";

import { getSelectionBounds } from "../../../../../utils/canvas/canvasGeometry";

import BackgroundLayer from "../layers/BackgroundLayer";
import GridLayer from "../layers/GridLayer";
import MarqueeLayer from "../layers/MarqueeLayer";
import SelectionLayer from "../layers/SelectionLayer";
import GroupTransformerLayer from "../layers/GroupTransformerLayer";
import ZoneLayer from "../layers/ZoneLayer";

import useCanvasTransform from "../hooks/useCanvasTransform";
import useStageViewport from "../hooks/useStageViewport";
import useMarqueeSelection from "../hooks/useMarqueeSelection";

/**
 * ============================================================
 * CANVAS SƠ ĐỒ GHẾ (REACT KONVA)
 * ============================================================
 *
 * Cấu trúc layer (từ dưới lên trên):
 *   1. BackgroundLayer - nền trắng của vùng sơ đồ
 *   2. GridLayer      - lưới 20px (mốc snap)
 *   3. ZoneLayer      - các khu vực
 *   4. Selection      - khung bao nhóm / vùng chọn
 *   5. GroupTransform - tay nắm xoay / dãn của nhóm
 *   6. Marquee        - vùng kéo chọn
 */
export default function SeatMapCanvas({
    zones = [],
    selectedZoneIds = [],
    onSelectZone,
    onSelectZonesInRect,
    onUpdateZone,
    onUpdateZones,
    onBeforeDrag,
    canvasWidth = 900,
    canvasHeight = 600,
    showGrid = true,
    seatTool = "none",
    onSeatCellClick,
    gridSize = 20,
}) {
    const containerRef = useRef(null);
    const stageRef = useRef(null);

    const {
        viewport,
        scale,
        position,
        handleWheel,
        zoomIn,
        zoomOut,
        resetView,
        startPan,
        spacePressedRef,
    } = useStageViewport({
        stageRef,
        containerRef,
        canvasWidth,
        canvasHeight,
    });

    const { marquee, startMarquee } = useMarqueeSelection({
        stageRef,
        onSelectZone,
        onSelectZonesInRect,
        spacePressedRef,
    });

    const {
        startMove,
        startResize,
        startRotate,
        startPointDrag,
    } = useCanvasTransform({
        stageRef,
        zones,
        selectedZoneIds,
        onSelectZone,
        onUpdateZone,
        onUpdateZones,
        onBeforeDrag,
        canvasWidth,
        canvasHeight,
        gridSize,
    });

    // Sắp xếp theo z-order để vẽ đúng thứ tự.
    const orderedZones = useMemo(
        () =>
            [...zones].sort(
                (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
            ),
        [zones]
    );

    /**
     * Nhóm đang chọn: tất cả zone được chọn phải thuộc CÙNG một
     * groupId (và không bị khoá) thì mới coi là một nhóm.
     */
    const groupId = useMemo(() => {
        if (selectedZoneIds.length === 0) return null;

        const selected = zones.filter(
            (item) =>
                selectedZoneIds.includes(item.id) && !item.isLocked
        );

        if (selected.length === 0) return null;

        const ids = new Set(selected.map((item) => item.groupId || null));

        if (ids.size !== 1) return null;

        const only = ids.values().next().value;

        return only || null;
    }, [zones, selectedZoneIds]);

    // Các thành viên của nhóm đang chọn.
    const groupMembers = useMemo(() => {
        if (!groupId) return [];

        return zones.filter(
            (item) => item.groupId === groupId && !item.isLocked
        );
    }, [zones, groupId]);

    // Hộp bao trọn của nhóm.
    const groupBounds = useMemo(() => {
        if (groupMembers.length < 2) return null;

        return getSelectionBounds(groupMembers);
    }, [groupMembers]);

    // Hộp bao của vùng chọn (nhiều zone, chưa gom nhóm).
    const selectionBounds = useMemo(() => {
        const selected = zones.filter((zone) =>
            selectedZoneIds.includes(zone.id)
        );

        if (selected.length < 2) return null;

        return getSelectionBounds(selected);
    }, [zones, selectedZoneIds]);

    const handleZonePointerDown = useCallback(
        (event, zone) => {
            startMove(event, zone);
        },
        [startMove]
    );

    const handleGroupResizeStart = useCallback(
        (event, handle) => {
            const anchor = groupMembers[0];

            if (!anchor) return;

            startResize(event, anchor, handle);
        },
        [groupMembers, startResize]
    );

    const handleGroupRotateStart = useCallback(
        (event) => {
            const anchor = groupMembers[0];

            if (!anchor) return;

            startRotate(event, anchor);
        },
        [groupMembers, startRotate]
    );

    return (
        <div
            ref={containerRef}
            className="relative h-full w-full overflow-hidden bg-gray-50"
            style={{ minHeight: 400 }}
        >
            <Stage
                ref={stageRef}
                width={viewport.width}
                height={viewport.height}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                onWheel={handleWheel}
                onContextMenu={(event) => {
                    // Chuột phải dùng để kéo canvas -> chặn menu mặc định.
                    event.evt.preventDefault();
                }}
                onPointerDown={(event) => {
                    // Bấm nền trống -> bắt đầu vùng kéo chọn.
                    if (event.target !== stageRef.current) return;

                    startMarquee(event);
                }}
                onMouseDown={(event) => {
                    // Kéo canvas: chuột phải / chuột giữa / giữ Space.
                    if (event.target !== stageRef.current) return;

                    startPan(event);
                }}
            >
                <BackgroundLayer
                    width={canvasWidth}
                    height={canvasHeight}
                />

                <GridLayer
                    width={canvasWidth}
                    height={canvasHeight}
                    gridSize={gridSize}
                    visible={showGrid}
                />

                {/* Các khu vực */}
                <Layer>
                    {orderedZones.map((zone) => (
                        <ZoneLayer
                            key={zone.id}
                            zone={zone}
                            isSelected={selectedZoneIds.includes(zone.id)}
                            hideHandles={
                                Boolean(zone.isLocked) || Boolean(groupId)
                            }
                            seatTool={seatTool}
                            onPointerDown={(event) =>
                                handleZonePointerDown(event, zone)
                            }
                            onResizeStart={(event, handle) =>
                                startResize(event, zone, handle)
                            }
                            onRotateStart={(event) =>
                                startRotate(event, zone)
                            }
                            onPointChange={(event, index) =>
                                startPointDrag(event, zone, index)
                            }
                            onSeatCellClick={(cell) =>
                                onSeatCellClick?.(zone, cell)
                            }
                        />
                    ))}
                </Layer>

                {/* Khung bao vùng chọn / nhóm */}
                <SelectionLayer
                    groupBounds={groupBounds}
                    groupCount={groupMembers.length}
                    selectionBounds={selectionBounds}
                    selectionCount={selectedZoneIds.length}
                    showSelection={selectedZoneIds.length > 1}
                />

                {/* Tay nắm xoay / dãn của nhóm */}
                <GroupTransformerLayer
                    bounds={groupBounds}
                    onResizeStart={handleGroupResizeStart}
                    onRotateStart={handleGroupRotateStart}
                />

                <MarqueeLayer rect={marquee} />
            </Stage>

            {/* Thanh điều khiển zoom */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-md">
                <button
                    type="button"
                    onClick={zoomOut}
                    title="Thu nhỏ"
                    className="rounded px-2 py-1 text-sm text-gray-600 transition hover:bg-gray-100"
                >
                    −
                </button>

                <span className="min-w-[52px] text-center text-xs font-medium text-gray-600">
                    {Math.round(scale * 100)}%
                </span>

                <button
                    type="button"
                    onClick={zoomIn}
                    title="Phóng to"
                    className="rounded px-2 py-1 text-sm text-gray-600 transition hover:bg-gray-100"
                >
                    +
                </button>

                <button
                    type="button"
                    onClick={resetView}
                    title="Đặt lại góc nhìn"
                    className="rounded px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-100"
                >
                    Đặt lại
                </button>
            </div>
        </div>
    );
}
