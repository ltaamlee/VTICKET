import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import {
    MIN_ZONE_SIZE,
    snapToGrid,
} from "../../../../../constants/seatmapConstants";
import { getSelectionBounds, scalePolygonPoints } from "../../../../../utils/canvas/canvasGeometry";
import { getGroupCenter, rotateGroup, scaleGroup } from "../../../../../utils/canvas/groupTransform";
import { getCanvasPointer } from "../../../../../utils/canvas/konvaCoordinates";
import { angleBetween, normalizeAngle } from "../../../../../utils/canvas/konvaCoordinates";

/**
 * ============================================================
 * HOOK THAO TÁC KÉO / DÃN / XOAY TRÊN CANVAS KONVA
 * ============================================================
 *
 * Thay thế toàn bộ logic pointermove/pointerup gắn vào `window`
 * của bản DOM/CSS cũ bằng cơ chế Konva:
 *  - `onPointerDown` trên shape -> bắt đầu thao tác.
 *  - `window` pointermove/pointerup -> tiếp tục & kết thúc thao tác.
 *
 * Toạ độ luôn được quy đổi về hệ toạ độ canvas (bỏ qua zoom/pan)
 * nhờ `getCanvasPointer`.
 */
export default function useCanvasTransform({
    stageRef,
    zones = [],
    selectedZoneIds = [],
    onSelectZone,
    onUpdateZone,
    onUpdateZones,
    onBeforeDrag,
    canvasWidth = 900,
    canvasHeight = 600,
    gridSize = 20,
    minZoneSize = MIN_ZONE_SIZE,
}) {
    // Ref giữ zones mới nhất (đọc trong handler, tránh stale closure).
    const zonesRef = useRef(zones);
    const selectedIdsRef = useRef(selectedZoneIds);

    // Thông tin thao tác đang chạy.
    const dragRef = useRef(null);

    // Điểm bắt đầu kéo (để tính delta).
    const startPointRef = useRef({ x: 0, y: 0 });

    useLayoutEffect(() => {
        zonesRef.current = zones;
    }, [zones]);

    useLayoutEffect(() => {
        selectedIdsRef.current = selectedZoneIds;
    }, [selectedZoneIds]);

    // ===== Các hàm phụ trợ =====

    const findZone = useCallback((zoneId) => {
        return zonesRef.current.find((z) => z.id === zoneId) || null;
    }, []);

    /**
     * Xác định các zone sẽ di chuyển cùng khi kéo 1 zone.
     *
     * - Nếu zone thuộc nhóm -> kéo cả nhóm.
     * - Nếu zone đang được chọn -> kéo cả vùng chọn.
     * - Ngược lại -> chỉ kéo zone đó.
     */
    const resolveMoveTargets = useCallback((zone, selectedIds) => {
        const ids = new Set();

        if (zone.groupId) {
            zonesRef.current.forEach((item) => {
                if (item.groupId === zone.groupId && !item.isLocked) {
                    ids.add(item.id);
                }
            });
        } else if (selectedIds.includes(zone.id)) {
            selectedIds.forEach((id) => {
                const item = zonesRef.current.find((z) => z.id === id);

                if (item && !item.isLocked) {
                    ids.add(id);
                }
            });
        } else if (!zone.isLocked) {
            ids.add(zone.id);
        }

        return [...ids];
    }, []);

    /**
     * Các thành viên của nhóm (dùng để xoay / dãn cả nhóm).
     */
    const resolveGroupMembers = useCallback((zone) => {
        if (!zone?.groupId) return null;

        const members = zonesRef.current.filter(
            (item) => item.groupId === zone.groupId && !item.isLocked
        );

        return members.length > 1 ? members : null;
    }, []);

    // ===== Bắt đầu thao tác =====

    /**
     * Chỉ chuột trái mới được thao tác trên khu vực.
     * Chuột phải / chuột giữa dùng để kéo (pan) canvas.
     */
    const isLeftButton = useCallback((event) => {
        const button = event.evt?.button;

        // Một số trình duyệt không expose `button` -> coi như chuột trái.
        if (button === undefined || button === null) return true;

        return button === 0;
    }, []);

    /**
     * Kéo / di chuyển zone.
     */
    const startMove = useCallback(
        (event, zone) => {
            event.cancelBubble = true;

            if (!isLeftButton(event)) return;

            const additive =
                event.evt?.shiftKey ||
                event.evt?.ctrlKey ||
                event.evt?.metaKey;

            onSelectZone?.(zone.id, { additive });

            // Zone đã khoá vẫn được chọn nhưng không được di chuyển.
            if (zone.isLocked) return;

            // Ghi lịch sử trước khi kéo để undo về đúng vị trí cũ.
            onBeforeDrag?.(zonesRef.current);

            const point = getCanvasPointer(stageRef.current);

            const targetIds = resolveMoveTargets(
                zone,
                selectedIdsRef.current
            );

            const origins = {};

            targetIds.forEach((id) => {
                const target = findZone(id);

                if (target) {
                    origins[id] = {
                        posX: target.posX,
                        posY: target.posY,
                        width: target.width,
                        height: target.height,
                    };
                }
            });

            dragRef.current = {
                mode: "move",
                zoneId: zone.id,
                targetIds,
                origins,
                startPosX: zone.posX,
                startPosY: zone.posY,
                offsetX: point.x - zone.posX,
                offsetY: point.y - zone.posY,
                positions: null,
            };

            startPointRef.current = point;
        },
        [
            stageRef,
            onSelectZone,
            onBeforeDrag,
            resolveMoveTargets,
            findZone,
            isLeftButton,
        ]
    );

    /**
     * Dãn / co zone (hoặc cả nhóm nếu zone thuộc nhóm).
     */
    const startResize = useCallback(
        (event, zone, handle) => {
            event.cancelBubble = true;

            if (!isLeftButton(event)) return;

            if (zone.isLocked) return;

            onBeforeDrag?.(zonesRef.current);

            const point = getCanvasPointer(stageRef.current);

            const members = resolveGroupMembers(zone);

            // Dãn cả nhóm.
            if (members) {
                const center = getGroupCenter(members);
                const groupBounds = getSelectionBounds(members);

                // Điểm neo: góc / cạnh đối diệp với tay nắm đang kéo.
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

                dragRef.current = {
                    mode: "resizeGroup",
                    zoneId: zone.id,
                    handle,
                    startPoint: point,
                    center,
                    anchor,
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
                };

                return;
            }

            // Chỉ 1 zone -> chọn zone đó rồi dãn riêng.
            onSelectZone?.(zone.id);

            dragRef.current = {
                mode: "resize",
                zoneId: zone.id,
                handle,
                startPoint: point,
                startRotation: zone.rotation || 0,
                startBounds: {
                    posX: zone.posX,
                    posY: zone.posY,
                    width: zone.width,
                    height: zone.height,
                },
                startPoints: Array.isArray(zone.points)
                    ? zone.points.map((p) => ({ ...p }))
                    : null,
                startHoles: Array.isArray(zone.holes)
                    ? zone.holes.map((ring) =>
                          ring.map((p) => ({ ...p }))
                      )
                    : null,
            };
        },
        [
            stageRef,
            onSelectZone,
            onBeforeDrag,
            resolveGroupMembers,
            isLeftButton,
        ]
    );

    /**
     * Xoay zone (hoặc cả nhóm).
     */
    const startRotate = useCallback(
        (event, zone) => {
            event.cancelBubble = true;

            if (!isLeftButton(event)) return;

            if (zone.isLocked) return;

            onBeforeDrag?.(zonesRef.current);

            const point = getCanvasPointer(stageRef.current);

            const members = resolveGroupMembers(zone);

            // Xoay cả nhóm.
            if (members) {
                const center = getGroupCenter(members);

                dragRef.current = {
                    mode: "rotateGroup",
                    zoneId: zone.id,
                    center,
                    startAngle: angleBetween(center, point),
                    origins: members.map((member) => ({
                        id: member.id,
                        rotation: member.rotation || 0,
                        posX: member.posX,
                        posY: member.posY,
                        width: member.width,
                        height: member.height,
                    })),
                };

                return;
            }

            // Chỉ 1 zone -> chọn zone đó rồi xoay riêng.
            onSelectZone?.(zone.id);

            const center = {
                x: zone.posX + zone.width / 2,
                y: zone.posY + zone.height / 2,
            };

            dragRef.current = {
                mode: "rotate",
                zoneId: zone.id,
                center,
                startAngle: angleBetween(center, point),
                startRotation: zone.rotation || 0,
            };
        },
        [
            stageRef,
            onSelectZone,
            onBeforeDrag,
            resolveGroupMembers,
            isLeftButton,
        ]
    );

    /**
     * Kéo một đỉnh của đa giác (chỉnh hình chữ T/U/L...).
     */
    const startPointDrag = useCallback(
        (event, zone, pointIndex) => {
            event.cancelBubble = true;

            if (!isLeftButton(event)) return;

            if (zone.isLocked) return;

            onSelectZone?.(zone.id);

            onBeforeDrag?.(zonesRef.current);

            const point = getCanvasPointer(stageRef.current);

            const vertices = Array.isArray(zone.points)
                ? zone.points
                : [];

            const vertex = vertices[pointIndex];

            if (!vertex) return;

            const vx = Array.isArray(vertex)
                ? Number(vertex[0]) || 0
                : Number(vertex?.x) || 0;
            const vy = Array.isArray(vertex)
                ? Number(vertex[1]) || 0
                : Number(vertex?.y) || 0;

            dragRef.current = {
                mode: "point",
                zoneId: zone.id,
                pointIndex,
                startPoint: point,
                startVertex: { x: vx, y: vy },
                rotation: Number(zone.rotation) || 0,
                flipX: Boolean(zone.flipX),
                flipY: Boolean(zone.flipY),
                startPoints: vertices.map((p) => ({
                    x: Array.isArray(p)
                        ? Number(p[0]) || 0
                        : Number(p?.x) || 0,
                    y: Array.isArray(p)
                        ? Number(p[1]) || 0
                        : Number(p?.y) || 0,
                })),
            };
        },
        [stageRef, onSelectZone, onBeforeDrag, isLeftButton]
    );

    /**
     * Cập nhật vị trí trực tiếp trên node Konva trong lúc kéo
     * (mượt hơn việc re-render từng frame).
     */
    const applyLivePositions = useCallback(
        (positions) => {
            const stage = stageRef.current;

            if (!stage) return;

            Object.entries(positions).forEach(([id, pos]) => {
                const node = stage.findOne(`#zone-${id}`);

                if (!node) return;

                const zone = findZone(id);

                if (!zone) return;

                const width = Math.max(Number(zone.width) || 0, 1);
                const height = Math.max(Number(zone.height) || 0, 1);

                node.position({
                    x: pos.posX + width / 2,
                    y: pos.posY + height / 2,
                });
            });
        },
        [stageRef, findZone]
    );

    // ===== Xử lý kéo trong lúc giữ chuột =====

    useEffect(() => {
        const applyPointerMove = (event) => {
            const current = dragRef.current;

            if (!current) return;

            const zone = findZone(current.zoneId);

            if (!zone) return;

            const point = getCanvasPointer(stageRef.current);

            // ---- Chỉnh đỉnh đa giác ----
            if (current.mode === "point") {
                const points = (
                    current.startPoints ||
                    (Array.isArray(zone.points) ? zone.points : [])
                ).map((p) => ({
                    x: Array.isArray(p)
                        ? Number(p[0]) || 0
                        : Number(p?.x) || 0,
                    y: Array.isArray(p)
                        ? Number(p[1]) || 0
                        : Number(p?.y) || 0,
                }));

                const currentPoint = points[current.pointIndex];

                if (!currentPoint) return;

                let deltaX = point.x - current.startPoint.x;
                let deltaY = point.y - current.startPoint.y;

                // Xoay ngược delta về hệ toạ độ nội bộ của zone nếu có rotation
                const rotation = current.rotation || 0;
                if (rotation) {
                    const rad = (-rotation * Math.PI) / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);

                    const localX = deltaX * cos - deltaY * sin;
                    const localY = deltaX * sin + deltaY * cos;

                    deltaX = localX;
                    deltaY = localY;
                }

                // Đảo delta nếu có lật gương flipX / flipY
                if (current.flipX) {
                    deltaX = -deltaX;
                }
                if (current.flipY) {
                    deltaY = -deltaY;
                }

                let nextX = current.startVertex.x + deltaX;
                let nextY = current.startVertex.y + deltaY;

                // Giữ Shift để chỉnh tự do từng 1px, mặc định hít nhẹ 2px
                const snap = event.shiftKey ? 1 : 2;
                nextX = Math.round(nextX / snap) * snap;
                nextY = Math.round(nextY / snap) * snap;

                points[current.pointIndex] = {
                    x: Math.max(0, Math.min(nextX, zone.width)),
                    y: Math.max(0, Math.min(nextY, zone.height)),
                };

                onUpdateZone?.(zone.id, { points });

                return;
            }

            // ---- Di chuyển (kéo cả nhóm / cả vùng chọn) ----
            if (current.mode === "move") {
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

                    positions[id] = {
                        posX: Math.max(
                            0,
                            Math.min(
                                origin.posX + deltaX,
                                canvasWidth - (origin.width ?? 0)
                            )
                        ),
                        posY: Math.max(
                            0,
                            Math.min(
                                origin.posY + deltaY,
                                canvasHeight - (origin.height ?? 0)
                            )
                        ),
                    };
                });

                // Cập nhật trực tiếp lên node Konva (không re-render).
                current.positions = positions;

                applyLivePositions(positions);

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

                const bounds = current.groupBounds;

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
                    current.anchor
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
                const angle = angleBetween(current.center, point);

                let delta = angle - current.startAngle;

                // Giữ Shift để khoá góc 15 độ.
                const stepped = event.shiftKey
                    ? Math.round(delta / 15) * 15
                    : Math.round(delta);

                const nextZones = rotateGroup(
                    current.origins.map((origin) => ({ ...origin })),
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

                let width = startW;
                let height = startH;

                if (hasE) {
                    width = Math.max(minZoneSize, startW + deltaX);
                }

                if (hasW) {
                    width = Math.max(minZoneSize, startW - deltaX);
                }

                if (hasS) {
                    height = Math.max(minZoneSize, startH + deltaY);
                }

                if (hasN) {
                    height = Math.max(minZoneSize, startH - deltaY);
                }

                const isCorner = hasE !== hasW && hasS !== hasN;

                // Giữ Shift: giữ tỉ lệ khi kéo góc.
                if (event.shiftKey && isCorner) {
                    const useWidth =
                        Math.abs(deltaX) >= Math.abs(deltaY);

                    const ratio = useWidth
                        ? width / (startW || 1)
                        : height / (startH || 1);

                    width = Math.max(
                        minZoneSize,
                        Math.round(startW * ratio)
                    );

                    height = Math.max(
                        minZoneSize,
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

                // Giữ Alt: co giãn quanh tâm.
                if (event.altKey) {
                    shiftLocalX = 0;
                    shiftLocalY = 0;

                    width = Math.max(
                        minZoneSize,
                        Math.round(startW + dw * 2)
                    );

                    height = Math.max(
                        minZoneSize,
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

                // Giới hạn trong canvas theo hộp bao quanh đã xoay.
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

                const patch = {
                    posX: Math.round(centerX - width / 2),
                    posY: Math.round(centerY - height / 2),
                    width: Math.round(width),
                    height: Math.round(height),
                };

                // Đa giác: scale lại các đỉnh theo tỉ lệ kích thước mới.
                if (
                    zone.shape === "POLYGON" &&
                    Array.isArray(current.startPoints) &&
                    current.startPoints.length >= 3
                ) {
                    const ratioX =
                        patch.width / (startBounds.width || 1);

                    const ratioY =
                        patch.height / (startBounds.height || 1);

                    patch.points = scalePolygonPoints(
                        current.startPoints,
                        ratioX,
                        ratioY,
                        patch.width,
                        patch.height
                    );

                    if (Array.isArray(current.startHoles)) {
                        patch.holes = current.startHoles.map((hole) =>
                            scalePolygonPoints(
                                hole,
                                ratioX,
                                ratioY,
                                patch.width,
                                patch.height
                            )
                        );
                    }
                }

                onUpdateZone?.(zone.id, patch);

                return;
            }

            // ---- Xoay ----
            if (current.mode === "rotate") {
                const angle = angleBetween(current.center, point);

                let rotation =
                    current.startRotation + (angle - current.startAngle);

                rotation = normalizeAngle(rotation);

                // Giữ Shift để khoá góc 15 độ.
                const stepped = event.shiftKey
                    ? Math.round(rotation / 15) * 15
                    : Math.round(rotation);

                onUpdateZone?.(zone.id, { rotation: stepped });
            }
        };

        const handlePointerMove = (event) => {
            if (!dragRef.current) return;

            applyPointerMove(event);
        };

        const handlePointerUp = () => {
            const current = dragRef.current;

            dragRef.current = null;

            // Commit vị trí cuối cùng vào state (chỉ 1 lần khi thả).
            if (current?.mode === "move" && current.positions) {
                const patches = {};

                current.targetIds.forEach((id) => {
                    const pos = current.positions[id];

                    if (!pos) return;

                    patches[id] = {
                        posX: pos.posX,
                        posY: pos.posY,
                    };
                });

                if (Object.keys(patches).length > 0) {
                    onUpdateZones?.(patches);
                }
            }
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [
        stageRef,
        canvasWidth,
        canvasHeight,
        gridSize,
        minZoneSize,
        onUpdateZone,
        onUpdateZones,
        findZone,
        applyLivePositions,
    ]);

    return {
        dragRef,
        startMove,
        startResize,
        startRotate,
        startPointDrag,
    };
}
