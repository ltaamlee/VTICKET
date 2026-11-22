/**
 * ============================================================
 * BỐ TRÍ LƯỚI GHẾ
 * ============================================================
 *
 * Nguồn duy nhất cho việc dựng lưới ghế.
 * Cả 3 nơi sử dụng (canvas Konva, preview SVG, panel chỉnh sửa)
 * đều gọi chung `buildSeatCells` để tránh lệch số ghế.
 *
 * Quy ước:
 * - Mọi ghế có kích thước HÌNH VUÔNG.
 * - Lưới được căn giữa trong Zone.
 * - Vị trí ghế cố định theo hàng và cột gốc.
 * - Ghế bị xoá không được đưa vào `cells`.
 * - Ghế bị khoá vẫn tồn tại trong `cells`.
 */

import {
    buildRowLabel,
    buildSeatNumberMap,
    NUMBERING_MODES,
} from "./seatNumbering";

import { createKeySet, seatKey } from "./seatKeys";

/**
 * Khoảng cách giữa các ô ghế (px) trên canvas.
 */
export const SEAT_GAP = 2;

/**
 * Bản đồ số ghế theo cấu hình Zone.
 *
 * Tất cả các thành phần hiển thị ghế đều dùng chung
 * hàm này để đảm bảo số ghế không bị lệch nhau.
 */
function createSeatNumberMap({
    rowCount,
    seatPerRow,
    removedSeats,
    numberingMode,
    numberingConfig,
}) {
    return buildSeatNumberMap({
        rowCount,
        seatPerRow,
        removedSeats,
        numberingMode:
            numberingMode || NUMBERING_MODES.SEQUENTIAL,
        numberingConfig: numberingConfig || {},
    });
}

/**
 * ============================================================
 * HÀM LÕI: DỰNG TOÀN BỘ Ô GHẾ
 * ============================================================
 *
 * @param {object} options
 * @param {number} options.rowCount
 * @param {number} options.seatPerRow
 * @param {number} options.width        bề rộng zone
 * @param {number} options.height       chiều cao zone
 * @param {string[]} options.removedSeats
 * @param {string[]} options.blockedSeats
 * @param {string} options.numberingMode
 * @param {object} options.numberingConfig
 * @param {number} options.gap          khoảng hở giữa các ô (0 = sát nhau)
 *
 * @returns {{
 *   rows:number, cols:number, cell:number,
 *   originX:number, originY:number,
 *   cells:Array<object>, removedCells:Array<object>,
 *   contentBounds:object|null, fullBounds:object
 * }}
 *
 * Mỗi ô có:
 * - key, row, col, rowLabel, seatNumber, blocked, removed
 * - x, y        : toạ độ góc trên-trái của ô (đã trừ gap)
 * - size        : cạnh ô vuông (không trừ gap)
 * - width,height: kích thước hiển thị (đã trừ gap)
 */
export function buildSeatCells({
    rowCount = 0,
    seatPerRow = 0,
    width = 0,
    height = 0,
    removedSeats = [],
    blockedSeats = [],
    numberingMode = NUMBERING_MODES.SEQUENTIAL,
    numberingConfig = {},
    gap = 0,
}) {
    const rows = Math.max(0, Number(rowCount) || 0);
    const cols = Math.max(0, Number(seatPerRow) || 0);

    const zoneW = Math.max(0, Number(width) || 0);
    const zoneH = Math.max(0, Number(height) || 0);

    const removed = createKeySet(removedSeats);
    const blocked = createKeySet(blockedSeats);

    const empty = {
        rows,
        cols,
        cell: 0,
        originX: 0,
        originY: 0,
        cells: [],
        removedCells: [],
        fullBounds: null,
        contentBounds: null,
    };

    if (rows === 0 || cols === 0) {
        return empty;
    }

    const numberMap = createSeatNumberMap({
        rowCount: rows,
        seatPerRow: cols,
        removedSeats,
        numberingMode,
        numberingConfig,
    });

    // Nếu không có kích thước zone thì chỉ dựng danh sách ô,
    // không tính toạ độ (trường hợp dùng cho panel chỉnh sửa).
    const hasSize = zoneW > 0 && zoneH > 0;

    // Cạnh ô vuông.
    const cell = hasSize
        ? Math.max(4, Math.floor(Math.min(zoneW / cols, zoneH / rows)))
        : 0;

    const gridW = cell * cols;
    const gridH = cell * rows;

    // Căn giữa lưới trong Zone.
    const originX = Math.round((zoneW - gridW) / 2);
    const originY = Math.round((zoneH - gridH) / 2);

    const cells = [];
    const removedCells = [];

    // Biên của các ô còn tồn tại (theo ô, không phụ thuộc khoảng hở).
    let minCol = Infinity;
    let maxCol = -Infinity;
    let minRow = Infinity;
    let maxRow = -Infinity;

    for (let row = 0; row < rows; row += 1) {
        const rowLabel = buildRowLabel(row);

        for (let col = 0; col < cols; col += 1) {
            const key = seatKey(row, col);
            const isRemoved = removed.has(key);

            const item = {
                key,
                row,
                col,
                rowLabel,

                // Số hiển thị theo chế độ đánh số.
                // Ô đã xóa giữ số vị trí gốc để nhận diện.
                seatNumber: isRemoved
                    ? String(col + 1)
                    : numberMap.get(key) || String(col + 1),

                blocked: blocked.has(key),
                removed: isRemoved,

                // Toạ độ tương đối trong Zone.
                x: originX + col * cell + gap / 2,
                y: originY + row * cell + gap / 2,

                // Cạnh ô vuông (không trừ gap).
                size: cell,

                // Kích thước hiển thị (đã trừ gap).
                width: Math.max(1, cell - gap),
                height: Math.max(1, cell - gap),
            };

            if (isRemoved) {
                removedCells.push(item);
            } else {
                cells.push(item);

                minCol = Math.min(minCol, col);
                maxCol = Math.max(maxCol, col);
                minRow = Math.min(minRow, row);
                maxRow = Math.max(maxRow, row);
            }
        }
    }

    const fullBounds = hasSize
        ? {
              x: originX,
              y: originY,
              width: gridW,
              height: gridH,
          }
        : null;

    /**
     * Khung bao của các ô còn tồn tại.
     *
     * Tính theo lưới (không tính khoảng hở) để preview SVG và
     * canvas Konva luôn cắt đường bao giống nhau.
     */
    const contentBounds =
        hasSize && cells.length > 0
            ? {
                  x: originX + minCol * cell,
                  y: originY + minRow * cell,
                  width: (maxCol - minCol + 1) * cell,
                  height: (maxRow - minRow + 1) * cell,
              }
            : null;

    return {
        rows,
        cols,
        cell,
        originX,
        originY,
        cells,
        removedCells,
        fullBounds,
        contentBounds,
    };
}

/**
 * Bố trí lưới ghế trên canvas (Konva).
 *
 * Các ô dính sát nhau - dùng bởi lớp Zone của editor.
 */
export function buildSeatLayout({
    rowCount = 0,
    seatPerRow = 0,
    width = 0,
    height = 0,
    removedSeats = [],
    blockedSeats = [],
    numberingMode = NUMBERING_MODES.SEQUENTIAL,
    numberingConfig = {},
}) {
    return buildSeatCells({
        rowCount,
        seatPerRow,
        width,
        height,
        removedSeats,
        blockedSeats,
        numberingMode,
        numberingConfig,
        gap: 0,
    });
}

/**
 * Danh sách ô cho SeatGrid (panel chỉnh sửa) - không cần toạ độ.
 *
 * Trả về:
 * - cells: các ghế còn tồn tại.
 * - removedCells: các ô đã xóa.
 * - seatCount: số ghế thực tế.
 * - blockedCount: số ghế bị khóa.
 */
export function buildSeatGrid({
    rowCount = 0,
    seatPerRow = 0,
    removedSeats = [],
    blockedSeats = [],
    numberingMode = NUMBERING_MODES.SEQUENTIAL,
    numberingConfig = {},
}) {
    const layout = buildSeatCells({
        rowCount,
        seatPerRow,
        removedSeats,
        blockedSeats,
        numberingMode,
        numberingConfig,
    });

    return {
        rows: layout.rows,
        cols: layout.cols,
        cells: layout.cells,
        removedCells: layout.removedCells,

        // Tổng số ghế còn tồn tại.
        seatCount: layout.cells.length,

        // Số ghế bị khóa.
        blockedCount: layout.cells.filter(
            (cell) => cell.blocked
        ).length,
    };
}

/**
 * ============================================================
 * THAO TÁC KHÓA / MỞ KHÓA / XÓA GHẾ
 * ============================================================
 */

/**
 * Khóa một ô.
 *
 * Nếu ô đã bị xóa thì khôi phục ô trước khi khóa.
 */
export function blockSeatCell(blockedSeats, removedSeats, key) {
    const nextBlocked = createKeySet(blockedSeats);

    nextBlocked.add(key);

    return {
        blockedSeats: [...nextBlocked],
        removedSeats: (Array.isArray(removedSeats)
            ? removedSeats
            : []
        ).filter((item) => item !== key),
    };
}

/**
 * Mở khóa một ô.
 */
export function unblockSeatCell(blockedSeats, removedSeats, key) {
    const nextBlocked = createKeySet(blockedSeats);

    nextBlocked.delete(key);

    return {
        blockedSeats: [...nextBlocked],
        removedSeats: Array.isArray(removedSeats)
            ? removedSeats
            : [],
    };
}

/**
 * Xóa một ô ghế (tạo hàng so le).
 */
export function removeSeatCell(blockedSeats, removedSeats, key) {
    const nextRemoved = createKeySet(removedSeats);

    nextRemoved.add(key);

    const nextBlocked = createKeySet(blockedSeats);

    nextBlocked.delete(key);

    return {
        blockedSeats: [...nextBlocked],
        removedSeats: [...nextRemoved],
    };
}

/**
 * Khôi phục một ô ghế đã xóa.
 */
export function restoreSeatCell(blockedSeats, removedSeats, key) {
    const nextRemoved = createKeySet(removedSeats);

    nextRemoved.delete(key);

    return {
        blockedSeats: Array.isArray(blockedSeats)
            ? blockedSeats
            : [],
        removedSeats: [...nextRemoved],
    };
}
