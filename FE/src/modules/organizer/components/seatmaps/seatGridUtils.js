
/**
 * ============================================================
 * LƯỚI GHẾ (SEAT GRID)
 * ============================================================
 *
 * Mỗi Zone loại SEATED được tạo thành lưới:
 * - Hàng: A, B, C, ...
 * - Vị trí cột: 1, 2, 3, ...
 *
 * Hỗ trợ các chế độ đánh số:
 * - SEQUENTIAL: Đánh số tuần tự trong từng hàng.
 * - ODD_EVEN_SPLIT: Một phía lẻ, một phía chẵn.
 * - CUSTOM: Đánh số theo cấu hình riêng từng vị trí.
 *
 * Phân biệt:
 * - key: tọa độ gốc, ví dụ A|3.
 * - seatNumber: số hiển thị trên ghế, có thể thay đổi.
 *
 * Xóa ghế không làm thay đổi tọa độ gốc của các ghế còn lại.
 */

import {
    buildRowLabel,
    buildSeatNumberMap,
    NUMBERING_MODES,
} from "./seatNumbering";

/**
 * Khoảng cách giữa các ô ghế (px) trên canvas.
 */
export const SEAT_GAP = 2;

/**
 * Chuẩn hóa danh sách key thành Set.
 */
function createKeySet(keys) {
    return new Set(
        Array.isArray(keys)
            ? keys.map((key) => String(key ?? "").trim())
            : []
    );
}

/**
 * Tạo bản đồ số ghế theo cấu hình Zone.
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
 * Khoá duy nhất cho một ô trong lưới.
 *
 * Ví dụ:
 * rowIndex = 0, colIndex = 0 -> A|1
 * rowIndex = 1, colIndex = 2 -> B|3
 *
 * Không sử dụng seatNumber hiển thị làm key,
 * vì seatNumber có thể thay đổi sau khi đánh số lại.
 */
export function seatKey(rowIndex, colIndex) {
    return `${buildRowLabel(rowIndex)}|${colIndex + 1}`;
}

/**
 * ============================================================
 * BỐ TRÍ LƯỚI GHẾ TRÊN CANVAS
 * ============================================================
 *
 * - Tất cả ghế có kích thước hình vuông.
 * - Lưới được căn giữa trong Zone.
 * - Vị trí ghế cố định theo hàng và cột gốc.
 * - Ghế bị xóa không được đưa vào cells.
 * - Ghế bị khóa vẫn tồn tại trong cells.
 *
 * contentBounds:
 * Khung bao của các ghế còn tồn tại.
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

    if (rows === 0 || cols === 0 || zoneW === 0 || zoneH === 0) {
        return empty;
    }

    // Tạo bản đồ số ghế theo chế độ đánh số.
    const numberMap = createSeatNumberMap({
        rowCount: rows,
        seatPerRow: cols,
        removedSeats,
        numberingMode,
        numberingConfig,
    });

    // Cạnh ô vuông.
    const cell = Math.max(
        4,
        Math.floor(Math.min(zoneW / cols, zoneH / rows))
    );

    const gridW = cell * cols;
    const gridH = cell * rows;

    // Căn giữa lưới trong Zone.
    const originX = Math.round((zoneW - gridW) / 2);
    const originY = Math.round((zoneH - gridH) / 2);

    const cells = [];
    const removedCells = [];

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

                // Tọa độ tương đối trong Zone.
                x: originX + col * cell,
                y: originY + row * cell,
                size: cell,
            };

            if (isRemoved) {
                removedCells.push(item);
            } else {
                cells.push(item);
            }
        }
    }

    const fullBounds = {
        x: originX,
        y: originY,
        width: gridW,
        height: gridH,
    };

    // Khung bao của các ô còn tồn tại.
    const contentBounds = (() => {
        if (cells.length === 0) return null;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        cells.forEach((item) => {
            minX = Math.min(minX, item.x);
            minY = Math.min(minY, item.y);

            maxX = Math.max(maxX, item.x + item.size);
            maxY = Math.max(maxY, item.y + item.size);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    })();

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
 * ============================================================
 * TẠO DANH SÁCH Ô CHO SEAT GRID
 * ============================================================
 *
 * Dùng trong SeatGrid.jsx.
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
    const rows = Math.max(0, Number(rowCount) || 0);
    const cols = Math.max(0, Number(seatPerRow) || 0);

    const removed = createKeySet(removedSeats);
    const blocked = createKeySet(blockedSeats);

    const numberMap = createSeatNumberMap({
        rowCount: rows,
        seatPerRow: cols,
        removedSeats,
        numberingMode,
        numberingConfig,
    });

    const cells = [];
    const removedCells = [];

    for (let row = 0; row < rows; row += 1) {
        const rowLabel = buildRowLabel(row);

        for (let col = 0; col < cols; col += 1) {
            const key = seatKey(row, col);
            const isRemoved = removed.has(key);

            const cell = {
                key,
                row,
                col,
                rowLabel,

                // Số ghế hiển thị.
                seatNumber: isRemoved
                    ? String(col + 1)
                    : numberMap.get(key) || String(col + 1),

                blocked: blocked.has(key),
                removed: isRemoved,
            };

            if (isRemoved) {
                removedCells.push(cell);
                continue;
            }

            cells.push(cell);
        }
    }

    return {
        rows,
        cols,
        cells,
        removedCells,

        // Tổng số ghế còn tồn tại.
        seatCount: cells.length,

        // Số ghế bị khóa.
        blockedCount: cells.filter((cell) => cell.blocked).length,
    };
}

/**
 * ============================================================
 * TÍNH TỌA ĐỘ TỪNG GHẾ TRÊN CANVAS
 * ============================================================
 *
 * Trả về danh sách hình chữ nhật của các ghế.
 *
 * Mỗi phần tử có:
 * - key
 * - rowLabel
 * - seatNumber
 * - x, y
 * - width, height
 * - blocked
 *
 * Sử dụng chung numberingMode và numberingConfig.
 */
export function buildSeatCellRects({
    rowCount = 0,
    seatPerRow = 0,
    width = 0,
    height = 0,
    removedSeats = [],
    blockedSeats = [],
    numberingMode = NUMBERING_MODES.SEQUENTIAL,
    numberingConfig = {},
    gap = SEAT_GAP,
}) {
    const rows = Math.max(0, Number(rowCount) || 0);
    const cols = Math.max(0, Number(seatPerRow) || 0);

    if (rows === 0 || cols === 0) return [];

    const blocked = createKeySet(blockedSeats);

    const numberMap = createSeatNumberMap({
        rowCount: rows,
        seatPerRow: cols,
        removedSeats,
        numberingMode,
        numberingConfig,
    });

    const zoneW = Math.max(0, Number(width) || 0);
    const zoneH = Math.max(0, Number(height) || 0);

    if (zoneW === 0 || zoneH === 0) return [];

    // Cạnh ghế hình vuông.
    const cell = Math.max(
        4,
        Math.floor(Math.min(zoneW / cols, zoneH / rows))
    );

    const originX = Math.round((zoneW - cell * cols) / 2);
    const originY = Math.round((zoneH - cell * rows) / 2);

    const rects = [];

    for (let row = 0; row < rows; row += 1) {
        const rowLabel = buildRowLabel(row);

        for (let col = 0; col < cols; col += 1) {
            const key = seatKey(row, col);

            // Không tạo hình cho ghế đã xóa.
            if (!numberMap.has(key)) continue;

            rects.push({
                key,
                row,
                col,
                rowLabel,

                // Số hiển thị trên ghế.
                seatNumber: numberMap.get(key),

                // Tọa độ tương đối trong Zone.
                x: originX + col * cell + gap / 2,
                y: originY + row * cell + gap / 2,

                width: Math.max(1, cell - gap),
                height: Math.max(1, cell - gap),

                blocked: blocked.has(key),
            });
        }
    }

    return rects;
}

/**
 * ============================================================
 * THAO TÁC KHÓA / MỞ KHÓA GHẾ
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
    return {
        blockedSeats: (Array.isArray(blockedSeats)
            ? blockedSeats
            : []
        ).filter((item) => item !== key),

        removedSeats: Array.isArray(removedSeats)
            ? removedSeats
            : [],
    };
}

/**
 * Xóa một ô khỏi lưới.
 *
 * Ghế không còn tồn tại trong danh sách cells.
 * Các ghế còn lại tự đánh số lại theo numberingMode.
 */
export function removeSeatCell(blockedSeats, removedSeats, key) {
    return {
        blockedSeats: (Array.isArray(blockedSeats)
            ? blockedSeats
            : []
        ).filter((item) => item !== key),

        removedSeats: [
            ...new Set([
                ...(Array.isArray(removedSeats) ? removedSeats : []),
                key,
            ]),
        ],
    };
}

/**
 * Khôi phục một ô đã xóa.
 *
 * Số ghế sẽ được tính lại theo chế độ đánh số hiện tại.
 */
export function restoreSeatCell(blockedSeats, removedSeats, key) {
    return {
        blockedSeats: Array.isArray(blockedSeats)
            ? blockedSeats
            : [],

        removedSeats: (Array.isArray(removedSeats)
            ? removedSeats
            : []
        ).filter((item) => item !== key),
    };
}