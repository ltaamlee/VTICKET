import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    DEFAULT_CANVAS_HEIGHT,
    DEFAULT_CANVAS_WIDTH,
    DEFAULT_SHAPE,
    GRID_SIZE,
} from "../../../../constants/seatmapConstants";
import {
    alignZones,
    distributeZones,
    fitSeatGrid,
    flipZones,
    getSelectionBounds,
    groupZones,
    reorderZones,
    ungroupZones,
} from "../../../../utils/canvas/canvasGeometry";
import { combineZones, splitZones } from "../../../../utils/canvas/booleanOperations";
import { convertSeatKeys } from "../../../../utils/seats/seatKeys";

/**
 * Toàn bộ logic cho modal chỉnh sửa sơ đồ ghế:
 *  - state danh sách khu vực
 *  - chọn nhiều (multi-select) + kéo vùng chọn trên canvas
 *  - gom nhóm / bỏ nhóm (Group / Ungroup)
 *  - căn lề & phân bố (Align / Distribute)
 *  - thứ tự hiển thị (z-order) & lật gương (Flip)
 *  - undo / redo
 *  - clipboard: copy / paste / duplicate
 *  - phím tắt bàn phím
 */
export default function useSeatMapEditor({ seatMap, onChange }) {
    const [zones, setZones] = useState([]);
    const [selectedZoneIds, setSelectedZoneIds] = useState([]);
    const [canvasWidth, setCanvasWidth] = useState(
        DEFAULT_CANVAS_WIDTH
    );
    const [canvasHeight, setCanvasHeight] = useState(
        DEFAULT_CANVAS_HEIGHT
    );
    const [showGrid, setShowGrid] = useState(true);

    // Lịch sử undo/redo.
    const historyRef = useRef({ past: [], future: [] });

    // Số lượng mục undo/redo để disable nút trên toolbar.
    const [historyState, setHistoryState] = useState({
        canUndo: false,
        canRedo: false,
    });

    const updateHistoryState = useCallback(() => {
        setHistoryState({
            canUndo: historyRef.current.past.length > 0,
            canRedo: historyRef.current.future.length > 0,
        });
    }, []);

    // Clipboard chứa zone đã copy.
    const clipboardRef = useRef(null);

    const zoneCounterRef = useRef(0);
    const groupCounterRef = useRef(0);

    // ===== Nạp dữ liệu sơ đồ =====
    useEffect(() => {
        if (!seatMap) {
            setZones([]);
            setCanvasWidth(DEFAULT_CANVAS_WIDTH);
            setCanvasHeight(DEFAULT_CANVAS_HEIGHT);
            setSelectedZoneIds([]);

            return;
        }

        setCanvasWidth(
            seatMap.canvasWidth || DEFAULT_CANVAS_WIDTH
        );
        setCanvasHeight(
            seatMap.canvasHeight || DEFAULT_CANVAS_HEIGHT
        );

        setZones(
            (seatMap.zones || []).map((zone, index) => ({
                id: zone.id || `zone-${index}`,
                name: zone.name || "",
                code: zone.code || "",
                color: zone.color || "#3b82f6",
                type: zone.type || "SEATED",
                shape: zone.shape || DEFAULT_SHAPE,
                price: zone.price ?? 0,
                rowCount: zone.rowCount ?? 0,
                seatPerRow: zone.seatPerRow ?? 0,
                capacity: zone.capacity ?? 0,
                posX: zone.posX ?? 0,
                posY: zone.posY ?? 0,
                width: zone.width ?? 120,
                height: zone.height ?? 60,
                rotation: zone.rotation ?? 0,
                level: zone.level ?? 1,
                points: zone.points || null,
                holes: zone.holes || null,
                originParts: zone.originParts || null,
                groupId: zone.groupId || null,
                zIndex:
                    Number.isFinite(Number(zone.zIndex))
                        ? Number(zone.zIndex)
                        : index,
                flipX: zone.flipX ?? false,
                flipY: zone.flipY ?? false,
                // Các ô ghế bị khoá / đã xoá trong lưới ghế.
                // Khoá được migrate từ kiểu cũ (hàng dùng số) sang
                // kiểu mới (hàng dùng chữ cái A, B, C...).
                blockedSeats: convertSeatKeys(zone.blockedSeats),
                removedSeats: convertSeatKeys(zone.removedSeats),
                // Chiều trả ghế ngẫu nhiên: theo hàng hay theo cột.
                seatNumbering: zone.seatNumbering || "ROW",
                seats: zone.seats || [],
            }))
        );

        setSelectedZoneIds([]);

        historyRef.current = { past: [], future: [] };
        updateHistoryState();
    }, [seatMap, updateHistoryState]);

    // ===== Undo / Redo =====
    // Ref giữ zones mới nhất để commit nhanh.
    const zonesRef = useRef(zones);
    const canvasWidthRef = useRef(canvasWidth);
    const canvasHeightRef = useRef(canvasHeight);

    // Tạo id duy nhất cho zone mới.
    const nextZoneId = useCallback(() => {
        zoneCounterRef.current += 1;

        return `new-${Date.now()}-${zoneCounterRef.current}`;
    }, []);

    // Đồng bộ zones vào ref TRƯỚC khi paint (layout effect).
    // Nếu dùng useEffect, ref sẽ trễ 1 frame -> khi kéo nhanh, event
    // pointermove kế tiếp đọc vị trí cũ -> hình bị giật.
    useLayoutEffect(() => {
        zonesRef.current = zones;
    }, [zones]);

    useLayoutEffect(() => {
        canvasWidthRef.current = canvasWidth;
        canvasHeightRef.current = canvasHeight;
    }, [canvasWidth, canvasHeight]);

    /**
     * Đẩy một trạng thái cụ thể vào lịch sử undo.
     * Dùng khi kết thúc thao tác kéo/dãn/xoay trên canvas: trạng thái
     * trước khi bắt đầu kéo được ghi lại để undo về đúng vị trí cũ.
     */
    const pushHistory = useCallback((snapshot) => {
        if (!snapshot) return;

        historyRef.current.past.push(snapshot);
        historyRef.current.future = [];

        if (historyRef.current.past.length > 50) {
            historyRef.current.past.shift();
        }

        updateHistoryState();
    }, [updateHistoryState]);

    /** Thay toàn bộ danh sách zone (dùng cho add / remove / duplicate). */
    const commit = useCallback((nextZones) => {
        historyRef.current.past.push(zonesRef.current);
        historyRef.current.future = [];

        if (historyRef.current.past.length > 50) {
            historyRef.current.past.shift();
        }

        updateHistoryState();

        setZones(nextZones);
    }, [updateHistoryState]);

    /**
     * Copy TOÀN BỘ sơ đồ (khu vực + kích thước canvas) vào clipboard.
     * Dùng để dán sang sơ đồ khác mà không phải vẽ lại.
     */
    const copyWholeMap = useCallback(() => {
        if (zonesRef.current.length === 0) return false;

        clipboardRef.current = {
            __isWholeMap: true,
            canvasWidth: canvasWidthRef.current,
            canvasHeight: canvasHeightRef.current,
            zones: zonesRef.current.map((z) => ({ ...z })),
        };

        return true;
    }, []);

    /**
     * Dán toàn bộ sơ đồ đã copy (thay thế danh sách khu vực hiện tại).
     */
    const pasteWholeMap = useCallback(() => {
        const source = clipboardRef.current;

        if (!source?.__isWholeMap) return false;

        const newZones = source.zones.map((item) => ({
            ...item,
            id: nextZoneId(),
        }));

        commit(newZones);

        if (
            source.canvasWidth &&
            source.canvasHeight
        ) {
            setCanvasWidth(source.canvasWidth);
            setCanvasHeight(source.canvasHeight);
        }

        setSelectedZoneIds([]);

        return true;
    }, [commit, nextZoneId, setCanvasWidth, setCanvasHeight]);

    const undo = useCallback(() => {
        const { past, future } = historyRef.current;

        if (past.length === 0) return;

        const previous = past[past.length - 1];

        historyRef.current.past = past.slice(0, -1);
        historyRef.current.future = [zonesRef.current, ...future];

        updateHistoryState();

        setZones(previous);
    }, [updateHistoryState]);

    const redo = useCallback(() => {
        const { past, future } = historyRef.current;

        if (future.length === 0) return;

        const next = future[0];

        historyRef.current.future = future.slice(1);
        historyRef.current.past = [...past, zonesRef.current];

        updateHistoryState();

        setZones(next);
    }, [updateHistoryState]);

    // Số lượng mục undo/redo để disable nút trên toolbar.
    const canUndo = historyState.canUndo;
    const canRedo = historyState.canRedo;

    // ===== Thao tác với zone =====
    // Cập nhật tức thì (không ghi lịch sử) - dùng khi kéo/dãn/xoay
    // trên canvas để không làm đầy lịch sử.

    /**
     * So sánh nhanh xem patch có làm đổi zone hay không.
     * Dùng để bỏ qua setZones khi giá trị không đổi (ví dụ kéo chuột
     * trong cùng một ô lưới) - giúp canvas không render lại vô ích.
     */
    const hasChanged = useCallback((zone, patch) => {
        return Object.keys(patch).some(
            (key) => zone[key] !== patch[key]
        );
    }, []);

    const updateZone = useCallback(
        (zoneId, patch) => {
            setZones((prev) => {
                let changed = false;

                const next = prev.map((zone) => {
                    if (zone.id !== zoneId) return zone;

                    if (!hasChanged(zone, patch)) {
                        return zone;
                    }

                    changed = true;

                    return { ...zone, ...patch };
                });

                return changed ? next : prev;
            });
        },
        [hasChanged]
    );

    /**
     * Cập nhật nhiều zone cùng lúc (dùng khi di chuyển cả nhóm).
     * @param {Record<string, object>} patches map zoneId -> patch
     */
    const updateZones = useCallback(
        (patches) => {
            const ids = Object.keys(patches);

            if (ids.length === 0) return;

            setZones((prev) => {
                let changed = false;

                const next = prev.map((zone) => {
                    const patch = patches[zone.id];

                    if (!patch) return zone;

                    if (!hasChanged(zone, patch)) {
                        return zone;
                    }

                    changed = true;

                    return { ...zone, ...patch };
                });

                return changed ? next : prev;
            });
        },
        [hasChanged]
    );

    const addZone = useCallback(
        (zone) => {
            // Zone mới luôn nằm trên cùng (z-index cao nhất).
            const maxZ = zonesRef.current.reduce(
                (max, item) => Math.max(max, Number(item.zIndex) || 0),
                0
            );

            const nextZone = {
                ...zone,
                zIndex: (Number(zone.zIndex) || 0) + maxZ + 1,
            };

            commit([...zonesRef.current, nextZone]);

            setSelectedZoneIds([nextZone.id]);
        },
        [commit]
    );

    const removeZone = useCallback(
        (zoneId) => {
            commit(
                zonesRef.current.filter((zone) => zone.id !== zoneId)
            );

            setSelectedZoneIds((prev) =>
                prev.filter((id) => id !== zoneId)
            );
        },
        [commit]
    );

    /** Xoá tất cả zone đang chọn. */
    const removeSelectedZones = useCallback(() => {
        if (selectedZoneIds.length === 0) return;

        const idSet = new Set(selectedZoneIds);

        commit(
            zonesRef.current.filter((zone) => !idSet.has(zone.id))
        );

        setSelectedZoneIds([]);
    }, [selectedZoneIds, commit]);

    // ===== Chọn nhiều =====
    /**
     * Chọn zone. Nếu `additive` thì thêm/bớt vào danh sách chọn
     * (giữ phím Shift / Ctrl khi bấm trên canvas).
     */
    const selectZone = useCallback((zoneId, { additive = false } = {}) => {
        if (!zoneId) {
            setSelectedZoneIds([]);

            return;
        }

        setSelectedZoneIds((prev) => {
            if (!additive) return [zoneId];

            return prev.includes(zoneId)
                ? prev.filter((id) => id !== zoneId)
                : [...prev, zoneId];
        });
    }, []);

    /** Bỏ chọn tất cả. */
    const clearSelection = useCallback(() => {
        setSelectedZoneIds([]);
    }, []);

    /** Chọn tất cả khu vực trên canvas. */
    const selectAllZones = useCallback(() => {
        setSelectedZoneIds(zonesRef.current.map((zone) => zone.id));
    }, []);

    /**
     * Chọn theo vùng kéo trên canvas (marquee).
     * @param {{x:number,y:number,width:number,height:number}} rect
     */
    const selectZonesInRect = useCallback(
        (rect, { additive = false } = {}) => {
            const inside = zonesRef.current.filter((zone) => {
                const x = Number(zone.posX) || 0;
                const y = Number(zone.posY) || 0;
                const w = Number(zone.width) || 0;
                const h = Number(zone.height) || 0;

                return (
                    x < rect.x + rect.width &&
                    x + w > rect.x &&
                    y < rect.y + rect.height &&
                    y + h > rect.y
                );
            });

            const ids = inside.map((zone) => zone.id);

            setSelectedZoneIds((prev) =>
                additive ? [...new Set([...prev, ...ids])] : ids
            );
        },
        []
    );

    // ===== Copy / Paste / Duplicate =====
    // Clipboard chứa 1 zone hoặc nhiều zone.
    const copyZone = useCallback(() => {
        if (selectedZoneIds.length === 0) return false;

        const selected = zonesRef.current.filter((zone) =>
            selectedZoneIds.includes(zone.id)
        );

        if (selected.length === 0) return false;

        clipboardRef.current =
            selected.length === 1
                ? { ...selected[0] }
                : selected.map((z) => ({ ...z }));

        return true;
    }, [selectedZoneIds]);

    /** Copy toàn bộ khu vực (Ctrl+A). */
    const copyAllZones = useCallback(() => {
        if (zonesRef.current.length === 0) return false;

        clipboardRef.current = zonesRef.current.map((z) => ({ ...z }));

        return true;
    }, []);

    const pasteZone = useCallback(() => {
        const source = clipboardRef.current;

        if (!source) return false;

        // Clipboard có thể chứa 1 zone hoặc nhiều zone.
        const sources = Array.isArray(source) ? source : [source];

        const newZones = sources.map((item, index) => {
            const offset = (index + 1) * GRID_SIZE * 2;

            return {
                ...item,
                id: nextZoneId(),
                name: `${item.name} (bản sao)`,
                // Dịch sang phải một chút cho dễ phân biệt.
                posX: Math.min(
                    item.posX + offset,
                    Math.max(0, canvasWidth - item.width)
                ),
                posY: Math.min(
                    item.posY + offset,
                    Math.max(0, canvasHeight - item.height)
                ),
            };
        });

        commit([...zonesRef.current, ...newZones]);

        setSelectedZoneIds(newZones.map((zone) => zone.id));

        return true;
    }, [canvasWidth, canvasHeight, commit, nextZoneId]);

    const duplicateZone = useCallback(() => {
        if (selectedZoneIds.length === 0) return false;

        const selected = zonesRef.current.filter((zone) =>
            selectedZoneIds.includes(zone.id)
        );

        if (selected.length === 0) return false;

        const newZones = selected.map((zone) => ({
            ...zone,
            id: nextZoneId(),
            name: `${zone.name} (bản sao)`,
            posX: Math.min(
                zone.posX + GRID_SIZE * 2,
                Math.max(0, canvasWidth - zone.width)
            ),
            posY: Math.min(
                zone.posY + GRID_SIZE * 2,
                Math.max(0, canvasHeight - zone.height)
            ),
        }));

        commit([...zonesRef.current, ...newZones]);

        setSelectedZoneIds(newZones.map((zone) => zone.id));

        return true;
    }, [
        selectedZoneIds,
        canvasWidth,
        canvasHeight,
        commit,
        nextZoneId,
    ]);

    /** Nhân bản một zone cụ thể (dùng từ nút trong danh sách). */
    const duplicateZoneById = useCallback(
        (zoneId) => {
            const zone = zonesRef.current.find(
                (z) => z.id === zoneId
            );

            if (!zone) return false;

            const newZone = {
                ...zone,
                id: nextZoneId(),
                name: `${zone.name} (bản sao)`,
                posX: Math.min(
                    zone.posX + GRID_SIZE * 2,
                    Math.max(0, canvasWidth - zone.width)
                ),
                posY: Math.min(
                    zone.posY + GRID_SIZE * 2,
                    Math.max(0, canvasHeight - zone.height)
                ),
            };

            commit([...zonesRef.current, newZone]);

            setSelectedZoneIds([newZone.id]);

            return true;
        },
        [canvasWidth, canvasHeight, commit, nextZoneId]
    );

    // ===== Gom nhóm / Bỏ nhóm =====
    /** Gom các zone đang chọn thành một nhóm. */
    const groupSelection = useCallback(() => {
        if (selectedZoneIds.length < 2) return false;

        groupCounterRef.current += 1;

        const groupId = `grp-${Date.now()}-${groupCounterRef.current}`;

        commit(
            groupZones(zonesRef.current, selectedZoneIds, groupId)
        );

        return true;
    }, [selectedZoneIds, commit]);

    /** Bỏ nhóm cho các zone đang chọn. */
    const ungroupSelection = useCallback(() => {
        if (selectedZoneIds.length === 0) return false;

        const hasGroup = zonesRef.current.some(
            (zone) =>
                selectedZoneIds.includes(zone.id) && zone.groupId
        );

        if (!hasGroup) return false;

        commit(ungroupZones(zonesRef.current, selectedZoneIds));

        return true;
    }, [selectedZoneIds, commit]);

    // ===== Căn lề / Phân bố =====
    /**
     * Căn lề khu vực đang chọn.
     * - Chọn 1 hình -> căn theo khung canvas.
     * - Chọn nhiều hình -> căn theo khung bao của nhóm đang chọn.
     */
    const alignSelection = useCallback(
        (alignment) => {
            if (selectedZoneIds.length === 0) return false;

            const canvasFrame = {
                x: 0,
                y: 0,
                width: canvasWidthRef.current,
                height: canvasHeightRef.current,
                right: canvasWidthRef.current,
                bottom: canvasHeightRef.current,
            };

            commit(
                alignZones(
                    zonesRef.current,
                    selectedZoneIds,
                    alignment,
                    canvasFrame
                )
            );

            return true;
        },
        [selectedZoneIds, commit]
    );

    /**
     * Căn chỉnh lại lưới ghế của 1 khu vực:
     * mọi ô vuông & bằng nhau, zone vừa khít lưới.
     */
    const fitZoneSeats = useCallback(
        (zoneId) => {
            const zone = zonesRef.current.find((z) => z.id === zoneId);

            if (!zone) return false;

            const next = fitSeatGrid(zone);

            if (next === zone) return false;

            commit(
                zonesRef.current.map((item) =>
                    item.id === zoneId ? next : item
                )
            );

            return true;
        },
        [commit]
    );

    const distributeSelection = useCallback(
        (direction) => {
            if (selectedZoneIds.length < 3) return false;

            commit(
                distributeZones(
                    zonesRef.current,
                    selectedZoneIds,
                    direction
                )
            );

            return true;
        },
        [selectedZoneIds, commit]
    );

    // ===== Z-order & Flip =====
    const reorderSelection = useCallback(
        (action) => {
            if (selectedZoneIds.length === 0) return false;

            commit(
                reorderZones(zonesRef.current, selectedZoneIds, action)
            );

            return true;
        },
        [selectedZoneIds, commit]
    );

    const flipSelection = useCallback(
        (axis) => {
            if (selectedZoneIds.length === 0) return false;

            commit(
                flipZones(zonesRef.current, selectedZoneIds, axis)
            );

            return true;
        },
        [selectedZoneIds, commit]
    );

    // ===== Gộp / Tách khối (boolean operations) =====

    /**
     * Gộp các zone đang chọn thành khối liền mạch.
     * @param {'UNION'|'DIFFERENCE'|'INTERSECT'|'EXCLUDE'} operation
     */
    const combineSelection = useCallback(
        (operation) => {
            if (selectedZoneIds.length < 2) {
                return { ok: false, reason: "Cần chọn ít nhất 2 khu vực." };
            }

            const result = combineZones(
                zonesRef.current,
                selectedZoneIds,
                operation
            );

            if (!result.ok) return result;

            // Gán id mới cho các khối vừa tạo.
            const nextZones = result.zones.map((zone) =>
                zone.id ? zone : { ...zone, id: nextZoneId() }
            );

            commit(nextZones);

            // Chọn lại các khối vừa tạo.
            const created = nextZones.filter(
                (zone) =>
                    Array.isArray(zone.originParts) &&
                    zone.originParts.length > 0
            );

            setSelectedZoneIds(created.map((zone) => zone.id));

            return { ok: true };
        },
        [selectedZoneIds, commit, nextZoneId]
    );

    /** Tách khối đã gộp về lại các thành phần gốc. */
    const splitSelection = useCallback(() => {
        if (selectedZoneIds.length === 0) {
            return { ok: false, reason: "Chưa chọn khu vực nào." };
        }

        const result = splitZones(zonesRef.current, selectedZoneIds);

        if (!result.ok) return result;

        // Gán id mới cho các zone vừa tách ra.
        const nextZones = result.zones.map((zone) =>
            zone.id ? zone : { ...zone, id: nextZoneId() }
        );

        commit(nextZones);

        setSelectedZoneIds([]);

        return { ok: true };
    }, [selectedZoneIds, commit, nextZoneId]);

    // ===== Phím tắt bàn phím =====
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Bỏ qua khi đang gõ trong ô nhập.
            const tag = event.target?.tagName;

            if (
                tag === "INPUT" ||
                tag === "SELECT" ||
                tag === "TEXTAREA"
            ) {
                return;
            }

            const meta = event.ctrlKey || event.metaKey;

            // Ctrl/Cmd + D: nhân bản
            if (meta && event.key.toLowerCase() === "d") {
                event.preventDefault();
                duplicateZone();
                return;
            }

            // Ctrl/Cmd + C: copy
            if (meta && event.key.toLowerCase() === "c") {
                event.preventDefault();
                copyZone();
                return;
            }

            // Ctrl/Cmd + V: dán
            if (meta && event.key.toLowerCase() === "v") {
                event.preventDefault();

                // Nếu clipboard có cả sơ đồ thì thay thế toàn bộ.
                if (pasteWholeMap()) return;

                pasteZone();

                return;
            }

            // Ctrl/Cmd + G: gom nhóm
            if (meta && event.key.toLowerCase() === "g") {
                event.preventDefault();

                if (event.shiftKey) {
                    ungroupSelection();
                } else {
                    groupSelection();
                }

                return;
            }

            // Ctrl/Cmd + Shift + U: gộp khối (Union)
            if (
                meta &&
                event.shiftKey &&
                event.key.toLowerCase() === "u"
            ) {
                event.preventDefault();
                combineSelection("UNION");

                return;
            }

            // Ctrl/Cmd + Shift + S: tách khối
            if (
                meta &&
                event.shiftKey &&
                event.key.toLowerCase() === "s"
            ) {
                event.preventDefault();
                splitSelection();

                return;
            }

            // Ctrl/Cmd + Z: undo
            if (meta && event.key.toLowerCase() === "z") {
                event.preventDefault();

                if (event.shiftKey) {
                    redo();
                } else {
                    undo();
                }

                return;
            }

            // Ctrl/Cmd + Y: redo
            if (meta && event.key.toLowerCase() === "y") {
                event.preventDefault();
                redo();
                return;
            }

            // Ctrl/Cmd + Shift + A: chọn tất cả khu vực
            if (
                meta &&
                event.shiftKey &&
                event.key.toLowerCase() === "a"
            ) {
                event.preventDefault();

                selectAllZones();

                return;
            }

            // Ctrl/Cmd + A: copy toàn bộ khu vực ra clipboard
            if (meta && event.key.toLowerCase() === "a") {
                event.preventDefault();

                copyAllZones();

                return;
            }

            // Delete / Backspace: xoá zone đang chọn
            if (
                !meta &&
                (event.key === "Delete" || event.key === "Backspace")
            ) {
                if (selectedZoneIds.length === 0) return;

                event.preventDefault();

                removeSelectedZones();

                return;
            }

            // Escape: bỏ chọn
            if (event.key === "Escape") {
                clearSelection();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () =>
            window.removeEventListener("keydown", handleKeyDown);
    }, [
        selectedZoneIds,
        copyZone,
        selectAllZones,
        copyAllZones,
        copyWholeMap,
        pasteWholeMap,
        pasteZone,
        duplicateZone,
        groupSelection,
        ungroupSelection,
        combineSelection,
        splitSelection,
        undo,
        redo,
        removeSelectedZones,
        clearSelection,
    ]);

    // Zone đang chọn chính (dùng cho panel thuộc tính).
    const selectedZone = useMemo(
        () =>
            zones.find((zone) => zone.id === selectedZoneIds[0]) || null,
        [zones, selectedZoneIds]
    );

    // Các zone đang chọn (dùng cho canvas + thao tác nhóm).
    const selectedZones = useMemo(
        () => zones.filter((zone) => selectedZoneIds.includes(zone.id)),
        [zones, selectedZoneIds]
    );

    // Khung bao trọn vùng đang chọn.
    const selectionBounds = useMemo(
        () => getSelectionBounds(selectedZones),
        [selectedZones]
    );

    /**
     * Tổng số ghế có thể bán.
     * Trừ các ô đã xoá và các ghế bị khoá trong lưới.
     */
    const totalSeats = useMemo(
        () =>
            zones.reduce((sum, zone) => {
                if (zone.type === "STANDING") {
                    return sum + (zone.capacity || 0);
                }

                if (zone.type !== "SEATED") return sum;

                const total =
                    (Number(zone.rowCount) || 0) *
                    (Number(zone.seatPerRow) || 0);

                const removed = Array.isArray(zone.removedSeats)
                    ? zone.removedSeats.length
                    : 0;

                const blocked = Array.isArray(zone.blockedSeats)
                    ? zone.blockedSeats.length
                    : 0;

                return sum + Math.max(0, total - removed - blocked);
            }, 0),
        [zones]
    );

    // Thông báo thay đổi ra ngoài (dùng cho việc lưu).
    useEffect(() => {
        onChange?.({ zones, canvasWidth, canvasHeight });
    }, [zones, canvasWidth, canvasHeight, onChange]);

    return {
        zones,
        setZones,
        selectedZone,
        selectedZoneIds,
        selectedZones,
        selectionBounds,
        selectZone,
        clearSelection,
        selectAllZones,
        selectZonesInRect,
        updateZone,
        updateZones,
        addZone,
        removeZone,
        removeSelectedZones,
        canvasWidth,
        setCanvasWidth,
        canvasHeight,
        setCanvasHeight,
        showGrid,
        setShowGrid,
        totalSeats,
        undo,
        redo,
        canUndo,
        canRedo,
        pushHistory,
        copyZone,
        copyAllZones,
        copyWholeMap,
        pasteWholeMap,
        pasteZone,
        duplicateZone,
        duplicateZoneById,
        nextZoneId,
        groupSelection,
        ungroupSelection,
        alignSelection,
        distributeSelection,
        reorderSelection,
        flipSelection,
        fitZoneSeats,
        combineSelection,
        splitSelection,
    };
}
