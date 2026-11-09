
import { Lock, Trash2, X } from "lucide-react";

import { buildSeatGrid } from "../../../../utils/seats/seatLayout";

const CELL = 24;

const TOOL_STYLES = {
    block: {
        active: "border-amber-500 bg-amber-50 text-amber-700",
        icon: Lock,
        label: "Khoá ghế",
    },
    remove: {
        active: "border-red-500 bg-red-50 text-red-700",
        icon: Trash2,
        label: "Xoá ghế",
    },
    none: {
        active: "border-gray-300 bg-gray-50 text-gray-600",
        icon: X,
        label: "Chỉ xem",
    },
};

export default function SeatGrid({
    zone,
    tool = "none",
    onCellClick,
    className = "",
}) {
    const grid = buildSeatGrid({
        rowCount: zone?.rowCount,
        seatPerRow: zone?.seatPerRow,
        removedSeats: zone?.removedSeats,
        blockedSeats: zone?.blockedSeats,

        // Cấu hình đánh số ghế.
        numberingMode: zone?.numberingMode,
        numberingConfig: zone?.numberingConfig,
    });

    if (grid.rows === 0 || grid.cols === 0) {
        return (
            <p className="text-xs text-gray-400">
                Nhập số hàng và số ghế mỗi hàng để tạo lưới ghế.
            </p>
        );
    }

    const isInteractive = tool !== "none";

    // Nhãn hàng A, B, C... kể cả khi toàn bộ ghế trong hàng bị xóa.
    const rowLabels = Array.from({ length: grid.rows }, (_, i) => {
        const cell =
            grid.cells.find((item) => item.row === i) ||
            grid.removedCells.find((item) => item.row === i);

        return cell?.rowLabel || "";
    });

    const removedCount = grid.removedCells.length;

    return (
        <div className={className}>
            {/* Thanh công cụ */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
                {Object.entries(TOOL_STYLES).map(([key, style]) => {
                    const Icon = style.icon;

                    return (
                        <span
                            key={key}
                            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
                                tool === key
                                    ? style.active
                                    : "border-gray-200 bg-white text-gray-400"
                            }`}
                        >
                            <Icon size={10} />
                            {style.label}
                        </span>
                    );
                })}

                <span className="ml-auto text-[10px] text-gray-400">
                    {grid.seatCount} ghế
                    {grid.blockedCount > 0 &&
                        ` · ${grid.blockedCount} khoá`}
                    {removedCount > 0 &&
                        ` · ${removedCount} đã xoá`}
                </span>
            </div>

            {/* Lưới ghế */}
            <div
                className="inline-grid gap-1 rounded-lg bg-gray-50 p-2"
                style={{
                    gridTemplateColumns: `1.25rem repeat(${grid.cols}, ${CELL}px)`,
                }}
            >
                {/* Ô góc trên cùng */}
                <div
                    style={{
                        gridColumn: 1,
                        gridRow: 1,
                        width: 24,
                        height: 16,
                    }}
                />

                {/* Các hàng ghế */}
                {Array.from({ length: grid.rows }, (_, rowIndex) => (
                    <RowCells
                        key={`row-${rowIndex}`}
                        rowIndex={rowIndex}
                        rowLabel={rowLabels[rowIndex]}
                        grid={grid}
                        isInteractive={isInteractive}
                        onCellClick={onCellClick}
                    />
                ))}
            </div>

            {/* Thông tin ô đã xóa */}
            {removedCount > 0 && (
                <p className="mt-1.5 text-[10px] text-gray-400">
                    Có {removedCount} ô đã xoá (ô nét đứt).
                    Bấm vào ô để khôi phục.
                </p>
            )}
        </div>
    );
}

/**
 * Một hàng của lưới ghế:
 * - Nhãn hàng.
 * - Các ô ghế còn tồn tại.
 * - Các ô đã xóa để có thể khôi phục.
 *
 * Mỗi ô giữ nguyên gridColumn/gridRow theo tọa độ gốc.
 * Việc đánh số lại không làm thay đổi vị trí hiển thị.
 */
function RowCells({
    rowIndex,
    rowLabel,
    grid,
    isInteractive,
    onCellClick,
}) {
    const allCells = [
        ...grid.cells,
        ...grid.removedCells,
    ]
        .filter((cell) => cell.row === rowIndex)
        .sort((a, b) => a.col - b.col);

    return (
        <>
            {/* Nhãn hàng */}
            <div
                className="flex items-center justify-center text-[9px] font-bold text-gray-500"
                style={{
                    width: 24,
                    height: CELL,
                    gridColumn: 1,
                    gridRow: rowIndex + 2,
                }}
            >
                {rowLabel}
            </div>

            {/* Các ô trong hàng */}
            {allCells.map((cell) => {
                const isRemoved = grid.removedCells.some(
                    (item) => item.key === cell.key
                );

                const positionLabel = `${cell.rowLabel}|${cell.col + 1}`;

                const seatLabel = cell.seatNumber
                    ? `${cell.rowLabel}-${cell.seatNumber}`
                    : positionLabel;

                let title;

                if (isRemoved) {
                    title = `Ô ${positionLabel} đã bị xoá (bấm để khôi phục)`;
                } else if (cell.blocked) {
                    title = `Ghế ${seatLabel} đang bị khoá`;
                } else {
                    title = `Ghế ${seatLabel}`;
                }

                return (
                    <button
                        key={cell.key}
                        type="button"
                        disabled={!isInteractive}
                        title={title}
                        onClick={(event) => {
                            event.stopPropagation();

                            onCellClick?.({
                                ...cell,
                                removed: isRemoved,
                            });
                        }}
                        className={`flex items-center justify-center rounded border text-[9px] font-semibold transition ${
                            isRemoved
                                ? "border-dashed border-gray-300 bg-transparent text-gray-300 hover:border-red-300 hover:bg-red-50"
                                : cell.blocked
                                  ? "border-amber-400 bg-amber-100 text-amber-700"
                                  : "border-gray-300 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600"
                        } ${
                            isInteractive
                                ? "cursor-pointer"
                                : "cursor-default"
                        }`}
                        style={{
                            width: CELL,
                            height: CELL,

                            // Vị trí gốc không thay đổi khi đánh số lại.
                            gridColumn: cell.col + 2,
                            gridRow: rowIndex + 2,
                        }}
                    >
                        {isRemoved ? (
                            <span className="text-[8px]">×</span>
                        ) : cell.blocked ? (
                            <Lock size={10} />
                        ) : (
                            cell.seatNumber
                        )}
                    </button>
                );
            })}
        </>
    );
}