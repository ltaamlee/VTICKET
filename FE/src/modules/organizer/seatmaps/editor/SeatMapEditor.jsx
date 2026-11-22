import { useCallback, useState } from "react";
import {
    Save,
    Magnet,
    Ruler,
    Undo2,
    Redo2,
    Copy,
    CopyPlus,
    ClipboardPaste,
    Lock,
    Trash,
} from "lucide-react";

import Button from "../../../../components/common/button/Button";
import SeatMapCanvas from "./canvas/SeatMapCanvas";
import SeatMapSidebar from "./components/SeatMapSidebar";
import ZonePropertiesPanel from "./components/ZonePropertiesPanel";
import CanvasArrangeToolbar from "./components/CanvasArrangeToolbar";
import useSeatMapEditor from "./hooks/useSeatMapEditor";
import { GRID_SIZE } from "../../../../constants/seatmapConstants";
import {
    blockSeatCell,
    removeSeatCell,
    restoreSeatCell,
    unblockSeatCell,
} from "../../../../utils/seats/seatLayout";

/**
 * Phím tắt:
 *   Ctrl+C                 Copy khu vực
 *   Ctrl+V                 Dán khu vực
 *   Ctrl+D                 Nhân bản khu vực
 *   Delete                 Xóa khu vực
 *   Ctrl+Z                 Undo
 *   Ctrl+Y                 Redo
 *   Ctrl+Shift+Z           Redo
 *   Ctrl+Shift+A           Chọn tất cả
 *   Escape                 Bỏ chọn
 *   Ctrl+G                 Gom nhóm
 *   Ctrl+Shift+G           Bỏ nhóm
 *   Ctrl+Shift+U           Gộp khối (Union)
 *   Ctrl+Shift+S           Tách khối
 */
function SeatMapEditor({
    open = true,
    seatMap = null,
    onClose,
    onSave,
    onAlert,
    saving = false,
}) {
    const [name, setName] = useState(seatMap?.name || "");

    /**
     * Công cụ thao tác trên lưới ghế:
     * none   : Chỉ xem / kéo thả khu vực
     * block  : Khóa ghế, không bán vé
     * remove : Xóa ô ghế, tạo hàng so le
     */
    const [seatTool, setSeatTool] = useState("none");

    const editor = useSeatMapEditor({ seatMap });

    const {
        zones,
        selectedZone,
        selectedZoneIds,
        selectedZones,
        selectZone,
        clearSelection,
        selectAllZones,
        selectZonesInRect,
        updateZone,
        updateZones,
        addZone,
        removeZone,
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
        pasteZone,
        duplicateZone,
        duplicateZoneById,
        copyWholeMap,
        pasteWholeMap,
        groupSelection,
        ungroupSelection,
        alignSelection,
        distributeSelection,
        reorderSelection,
        flipSelection,
        fitZoneSeats,
        combineSelection,
        splitSelection,
    } = editor;

    // ===== DUPLICATE ZONE =====

    const handleDuplicateById = useCallback(
        (zoneId) => {
            duplicateZoneById(zoneId);
        },
        [duplicateZoneById]
    );

    // ===== SEAT CELL OPERATIONS =====

    /**
     * Xử lý thao tác trên một ô ghế.
     *
     * Zone đã khóa thì không cho phép chỉnh sửa ghế.
     * Ô đã xóa có thể được khôi phục bằng cách bấm trực tiếp.
     */
    const handleSeatCellClick = useCallback(
        (zone, cell) => {
            if (seatTool === "none") return;

            // Không cho phép chỉnh sửa ghế trong Zone đã khóa.
            if (zone.isLocked) {
                onAlert?.(
                    "warning",
                    "Khu vực đang bị khóa. Hãy mở khóa trước khi chỉnh sửa ghế."
                );
                return;
            }

            const blockedSeats = zone.blockedSeats || [];
            const removedSeats = zone.removedSeats || [];

            // Khôi phục ô ghế đã xóa.
            if (cell.removed) {
                updateZone(
                    zone.id,
                    restoreSeatCell(
                        blockedSeats,
                        removedSeats,
                        cell.key
                    )
                );
                return;
            }

            // Khóa / mở khóa ghế.
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

                updateZone(zone.id, next);
                return;
            }

            // Xóa ghế.
            if (seatTool === "remove") {
                updateZone(
                    zone.id,
                    removeSeatCell(
                        blockedSeats,
                        removedSeats,
                        cell.key
                    )
                );
            }
        },
        [seatTool, updateZone, onAlert]
    );

    // ===== BOOLEAN OPERATIONS =====

    /**
     * Gộp các khu vực đang chọn thành một khối.
     */
    const handleCombine = useCallback(
        (operation) => {
            const result = combineSelection(operation);

            if (!result.ok) {
                onAlert?.("error", result.reason);
                return;
            }

            onAlert?.(
                "success",
                "Đã gộp các khu vực thành một khối liền mạch."
            );
        },
        [combineSelection, onAlert]
    );

    /**
     * Tách khối đã gộp về các thành phần gốc.
     */
    const handleSplit = useCallback(() => {
        const result = splitSelection();

        if (!result.ok) {
            onAlert?.("error", result.reason);
            return;
        }

        onAlert?.(
            "success",
            "Đã tách khối thành các thành phần."
        );
    }, [splitSelection, onAlert]);

    // ===== FIT SEATS =====

    /**
     * Căn chỉnh lưới ghế:
     * - Mọi ô ghế vuông và bằng nhau.
     * - Khu vực vừa khít với lưới ghế.
     */
    const handleFitSeats = useCallback(() => {
        const zoneId = selectedZoneIds[0];

        if (!zoneId) {
            onAlert?.(
                "error",
                "Hãy chọn một khu vực ghế ngồi để căn chỉnh lại lưới ghế."
            );
            return;
        }

        const zone = zones.find((item) => item.id === zoneId);

        if (zone?.isLocked) {
            onAlert?.(
                "warning",
                "Khu vực đang bị khóa. Hãy mở khóa trước khi căn chỉnh ghế."
            );
            return;
        }

        if (!fitZoneSeats(zoneId)) {
            onAlert?.(
                "info",
                "Lưới ghế đã căn chỉnh sẵn, không cần thay đổi."
            );
            return;
        }

        onAlert?.(
            "success",
            "Đã căn chỉnh lại lưới ghế: mọi ô vuông và bằng nhau."
        );
    }, [selectedZoneIds, zones, fitZoneSeats, onAlert]);

    // ===== SAVE =====

    const handleSave = () => {
        if (!name.trim()) {
            onAlert?.(
                "error",
                "Vui lòng nhập tên sơ đồ sự kiện."
            );
            return;
        }

        if (zones.length === 0) {
            onAlert?.(
                "error",
                "Sơ đồ ghế cần ít nhất một khu vực."
            );
            return;
        }

        const invalidZone = zones.find(
            (zone) => !zone.name?.trim()
        );

        if (invalidZone) {
            onAlert?.(
                "error",
                "Vui lòng nhập tên cho tất cả khu vực."
            );
            return;
        }

        const invalidSeated = zones.find(
            (zone) =>
                zone.type === "SEATED" &&
                (
                    (Number(zone.rowCount) || 0) === 0 ||
                    (Number(zone.seatPerRow) || 0) === 0
                )
        );

        if (invalidSeated) {
            onAlert?.(
                "error",
                `Khu vực "${invalidSeated.name}" cần ít nhất một hàng và một ghế.`
            );
            return;
        }

        const payload = {
            name: name.trim(),
            status: seatMap?.status || "DRAFT",
            canvasWidth,
            canvasHeight,

            zones: zones.map((zone) => {
                const blockedSeats = Array.isArray(zone.blockedSeats)
                    ? zone.blockedSeats
                    : [];

                const removedSeats = Array.isArray(zone.removedSeats)
                    ? zone.removedSeats
                    : [];

                const rowCount = Number(zone.rowCount) || 0;
                const seatPerRow = Number(zone.seatPerRow) || 0;

                const capacity =
                    zone.type === "STANDING"
                        ? Number(zone.capacity) || 0
                        : zone.type === "SEATED"
                          ? Math.max(
                                0,
                                rowCount * seatPerRow -
                                    removedSeats.length -
                                    blockedSeats.length
                            )
                          : 0;

                return {
                    name: zone.name.trim(),
                    code: zone.code?.trim() || null,

                    color: zone.color,
                    type: zone.type,
                    shape: zone.shape,

                    price:
                        zone.type === "STAGE"
                            ? 0
                            : Number(zone.price) || 0,

                    rowCount:
                        zone.type === "SEATED" ? rowCount : 0,

                    seatPerRow:
                        zone.type === "SEATED" ? seatPerRow : 0,

                    blockedSeats:
                        zone.type === "SEATED"
                            ? blockedSeats
                            : [],

                    removedSeats:
                        zone.type === "SEATED"
                            ? removedSeats
                            : [],

                    seatNumbering:
                        zone.seatNumbering === "COLUMN"
                            ? "COLUMN"
                            : "ROW",

                    capacity,

                    posX: Number(zone.posX) || 0,
                    posY: Number(zone.posY) || 0,
                    width: Number(zone.width) || 120,
                    height: Number(zone.height) || 60,
                    rotation: Number(zone.rotation) || 0,
                    level: Number(zone.level) || 1,

                    points: zone.points || null,
                    holes: zone.holes || null,
                    originParts: zone.originParts || null,

                    groupId: zone.groupId || null,
                    zIndex: Number(zone.zIndex) || 0,

                    flipX: zone.flipX === true,
                    flipY: zone.flipY === true,

                    // Trạng thái khóa Zone.
                    isLocked: zone.isLocked === true,
                };
            }),
        };

        onSave?.(payload);
    };

    if (!open) return null;

    return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
            {/* ===== MAIN CONTENT ===== */}
            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)_300px]">
                {/* ===== LEFT SIDEBAR ===== */}
                <aside className="min-h-0 overflow-y-auto border-b border-gray-100 lg:border-b-0 lg:border-r">
                    <SeatMapSidebar
                        name={name}
                        onNameChange={setName}
                        canvasWidth={canvasWidth}
                        canvasHeight={canvasHeight}
                        onCanvasWidthChange={setCanvasWidth}
                        onCanvasHeightChange={setCanvasHeight}
                        totalSeats={totalSeats}
                        zones={zones}
                        onAddZone={addZone}
                    />
                </aside>

                {/* ===== CENTER CANVAS ===== */}
                <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-gray-50">
                    {/* ===== MAIN TOOLBAR ===== */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
                        {/* Undo / Redo */}
                        <div className="flex items-center rounded-lg border border-gray-200">
                            <button
                                type="button"
                                onClick={undo}
                                disabled={!canUndo}
                                title="Hoàn tác (Ctrl+Z)"
                                className="rounded-l-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                            >
                                <Undo2 size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={redo}
                                disabled={!canRedo}
                                title="Làm lại (Ctrl+Y)"
                                className="rounded-r-lg border-l border-gray-200 p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                            >
                                <Redo2 size={15} />
                            </button>
                        </div>

                        {/* Copy / Paste / Duplicate */}
                        <div className="flex items-center rounded-lg border border-gray-200">
                            <button
                                type="button"
                                onClick={copyZone}
                                disabled={selectedZoneIds.length === 0}
                                title="Copy khu vực (Ctrl+C)"
                                className="rounded-l-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                            >
                                <Copy size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={pasteZone}
                                title="Dán khu vực (Ctrl+V)"
                                className="border-l border-gray-200 p-2 text-gray-500 hover:bg-gray-100"
                            >
                                <ClipboardPaste size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={duplicateZone}
                                disabled={selectedZoneIds.length === 0}
                                title="Nhân bản khu vực (Ctrl+D)"
                                className="rounded-r-lg border-l border-gray-200 p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                            >
                                <CopyPlus size={15} />
                            </button>
                        </div>

                        {/* Selection */}
                        <div className="flex items-center rounded-lg border border-gray-200">
                            <button
                                type="button"
                                onClick={selectAllZones}
                                title="Chọn tất cả khu vực (Ctrl+Shift+A)"
                                className="rounded-l-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Chọn tất cả
                            </button>
                            <button
                                type="button"
                                onClick={clearSelection}
                                disabled={selectedZoneIds.length === 0}
                                title="Bỏ chọn (Esc)"
                                className="rounded-r-lg border-l border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                            >
                                Bỏ chọn
                            </button>
                        </div>

                        {/* Copy / Paste whole map */}
                        <div className="flex items-center rounded-lg border border-gray-200">
                            <button
                                type="button"
                                onClick={copyWholeMap}
                                title="Copy toàn bộ sơ đồ để dán sang sơ đồ khác"
                                className="rounded-l-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Copy sơ đồ
                            </button>
                            <button
                                type="button"
                                onClick={pasteWholeMap}
                                title="Dán toàn bộ sơ đồ đã copy"
                                className="rounded-r-lg border-l border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Dán sơ đồ
                            </button>
                        </div>

                        {/* Grid */}
                        <button
                            type="button"
                            onClick={() => setShowGrid((prev) => !prev)}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                                showGrid
                                    ? "border-blue-300 bg-blue-50 text-blue-700"
                                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                            title={`Dính vào lưới ${GRID_SIZE}px`}
                        >
                            <Magnet size={14} />
                            Lưới {GRID_SIZE}px
                        </button>

                        {/* Seat tools */}
                        <div className="flex items-center rounded-lg border border-gray-200">
                            <button
                                type="button"
                                onClick={() =>
                                    setSeatTool((prev) =>
                                        prev === "block" ? "none" : "block"
                                    )
                                }
                                title="Khóa ghế: bấm vào ô ghế để không bán vé"
                                className={`flex items-center gap-1.5 rounded-l-lg px-3 py-2 text-xs font-medium transition ${
                                    seatTool === "block"
                                        ? "bg-amber-100 text-amber-700"
                                        : "text-gray-500 hover:bg-gray-50"
                                }`}
                            >
                                <Lock size={14} />
                                Khóa ghế
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setSeatTool((prev) =>
                                        prev === "remove" ? "none" : "remove"
                                    )
                                }
                                title="Xóa ghế: bấm vào ô để tạo hàng so le"
                                className={`flex items-center gap-1.5 rounded-r-lg border-l border-gray-200 px-3 py-2 text-xs font-medium transition ${
                                    seatTool === "remove"
                                        ? "bg-red-100 text-red-700"
                                        : "text-gray-500 hover:bg-gray-50"
                                }`}
                            >
                                <Trash size={14} />
                                Xóa ghế
                            </button>
                        </div>

                        {/* Canvas dimensions */}
                        <p className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-gray-400">
                            <Ruler size={14} />
                            {canvasWidth} × {canvasHeight}
                        </p>
                    </div>

                    {/* ===== ARRANGE TOOLBAR ===== */}
                    <div className="shrink-0 overflow-x-auto border-b border-gray-200 bg-white px-3 py-2">
                        <CanvasArrangeToolbar
                            selectedCount={selectedZoneIds.length}
                            hasGroup={selectedZones.some((zone) => zone.groupId)}
                            canSplit={selectedZones.some(
                                (zone) =>
                                    (Array.isArray(zone.originParts) &&
                                        zone.originParts.length > 0) ||
                                    (Array.isArray(zone.holes) &&
                                        zone.holes.length > 0)
                            )}
                            canFitSeats={selectedZones.some(
                                (zone) =>
                                    zone.type === "SEATED" &&
                                    !zone.isLocked &&
                                    (zone.rowCount || 0) > 0 &&
                                    (zone.seatPerRow || 0) > 0
                            )}
                            onGroup={groupSelection}
                            onUngroup={ungroupSelection}
                            onCombine={handleCombine}
                            onSplit={handleSplit}
                            onAlign={alignSelection}
                            onDistribute={distributeSelection}
                            onReorder={reorderSelection}
                            onFlip={flipSelection}
                            onFitSeats={handleFitSeats}
                            onAlert={onAlert}
                        />
                    </div>

                    {/* ===== CANVAS ===== */}
                    <div className="min-h-0 min-w-0 flex-1 overflow-auto p-4">
                        <SeatMapCanvas
                            zones={zones}
                            selectedZoneIds={selectedZoneIds}
                            onSelectZone={selectZone}
                            onSelectZonesInRect={selectZonesInRect}
                            onUpdateZone={updateZone}
                            onUpdateZones={updateZones}
                            onBeforeDrag={pushHistory}
                            canvasWidth={canvasWidth}
                            canvasHeight={canvasHeight}
                            showGrid={showGrid}
                            seatTool={seatTool}
                            onSeatCellClick={handleSeatCellClick}
                        />
                    </div>
                </section>

                {/* ===== RIGHT PROPERTIES PANEL ===== */}
                <aside className="min-h-0 overflow-y-auto border-t border-gray-100 lg:border-l lg:border-t-0">
                    {selectedZone ? (
                        <ZonePropertiesPanel
                            zone={selectedZone}
                            selectedCount={selectedZoneIds.length}
                            onChange={updateZone}
                            onClose={() => selectZone(null)}
                            onDelete={removeZone}
                            onDuplicate={handleDuplicateById}
                            onFitSeats={handleFitSeats}
                            seatTool={seatTool}
                            onSeatToolChange={setSeatTool}
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                            <p className="text-sm font-medium text-gray-500">
                                Chưa chọn khu vực nào
                            </p>
                            <p className="text-xs text-gray-400">
                                Bấm vào một khối trên canvas để xem và chỉnh thuộc tính.
                            </p>
                        </div>
                    )}
                </aside>
            </div>

            {/* ===== FOOTER ===== */}
            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-3">
                <div className="text-xs text-gray-500">
                    {zones.length} khu vực · {totalSeats} ghế
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <Save size={16} />
                        {saving
                            ? "Đang lưu..."
                            : seatMap
                              ? "Lưu thay đổi"
                              : "Tạo sơ đồ"}
                    </Button>
                </div>
            </footer>
        </div>
    );
}

export default SeatMapEditor;