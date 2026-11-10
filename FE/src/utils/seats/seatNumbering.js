/**
 * ============================================================
 * ĐÁNH SỐ GHẾ (CHUẨN PRETIX)
 * ============================================================
 *
 * Hỗ trợ các quy tắc chuyên nghiệp cho rạp hát & sự kiện:
 * 1. Chế độ:
 *    - SEQUENTIAL: 1, 2, 3, 4, 5...
 *    - ODD_EVEN_SPLIT: Nhà hát (Trái lẻ: 1, 3, 5... | Phải chẵn: 2, 4, 6...)
 * 2. Chiều đánh số:
 *    - LTR (Trái qua phải)
 *    - RTL (Phải qua trái)
 * 3. Nhãn hàng:
 *    - LETTERS (A, B, C...) hoặc NUMBERS (1, 2, 3...)
 *    - Đảo chiều hàng (gần hay xa sân khấu)
 * 4. Bỏ qua số kiêng kị:
 *    - Tự động nhảy qua số 13, số 4, 14...
 */

import { createKeySet, rowLabelToLetters } from "./seatKeys";

export const NUMBERING_MODES = {
    SEQUENTIAL: "SEQUENTIAL",
    ODD_EVEN_SPLIT: "ODD_EVEN_SPLIT",
    CUSTOM: "CUSTOM",
};

/**
 * Tạo nhãn hàng.
 * @param {number} rowIndex 0-based.
 * @param {number} totalRows tổng số hàng.
 * @param {object} config { rowType: "LETTERS"|"NUMBERS", reverseRows: boolean }
 */
export function buildRowLabel(rowIndex, totalRows = 1, config = {}) {
    const isReversed = config?.reverseRows === true;
    const actualIndex = isReversed ? totalRows - 1 - rowIndex : rowIndex;

    if (config?.rowType === "NUMBERS") {
        return String(actualIndex + 1);
    }

    return rowLabelToLetters(actualIndex + 1);
}

/**
 * Tìm số hợp lệ tiếp theo (bỏ qua các số kiêng kị).
 */
function getNextValidNumber(startNum, step, skipSet) {
    let current = startNum;
    while (skipSet.has(current)) {
        current += step;
    }
    return current;
}

/**
 * Sinh danh sách số ghế theo quy tắc Pretix.
 */
function generateNumbers(count, step, initialNum, skipSet) {
    const result = [];
    let current = getNextValidNumber(initialNum, step, skipSet);

    for (let i = 0; i < count; i++) {
        result.push(current);
        current = getNextValidNumber(current + step, step, skipSet);
    }

    return result;
}

/**
 * Tạo bản đồ số ghế theo toạ độ gốc.
 *
 * @returns {Map<string, string>} Map(key -> seatNumber)
 */
export function buildSeatNumberMap({
    rowCount = 0,
    seatPerRow = 0,
    removedSeats = [],
    numberingMode = NUMBERING_MODES.SEQUENTIAL,
    numberingConfig = {},
}) {
    const rows = Math.max(0, Number(rowCount) || 0);
    const cols = Math.max(0, Number(seatPerRow) || 0);

    const removed = createKeySet(removedSeats);
    const numberMap = new Map();

    const mode = Object.values(NUMBERING_MODES).includes(numberingMode)
        ? numberingMode
        : NUMBERING_MODES.SEQUENTIAL;

    // Danh sách số kiêng kị
    const skipList = Array.isArray(numberingConfig.skipNumbers)
        ? numberingConfig.skipNumbers
        : [];
    const skipSet = new Set(skipList.map((n) => Number(n)));

    const isRTL = numberingConfig.seatDirection === "RTL";
    const startNum = Math.max(1, Number(numberingConfig.startNumber) || 1);

    for (let row = 0; row < rows; row += 1) {
        const rowLabel = buildRowLabel(row, rows, numberingConfig);

        const availableSeats = [];
        for (let col = 0; col < cols; col += 1) {
            const key = `${rowLabel}|${col + 1}`;
            if (removed.has(key)) continue;

            availableSeats.push({ key, row, col });
        }

        if (availableSeats.length === 0) continue;

        // Nếu chiều từ Phải qua Trái (RTL) thì đảo ngược thứ tự gán số
        const targetSeats = isRTL ? [...availableSeats].reverse() : availableSeats;

        // 1. ĐÁNH SỐ TUẦN TỰ (SEQUENTIAL)
        if (mode === NUMBERING_MODES.SEQUENTIAL) {
            const numbers = generateNumbers(targetSeats.length, 1, startNum, skipSet);
            targetSeats.forEach((seat, idx) => {
                numberMap.set(seat.key, String(numbers[idx]));
            });
            continue;
        }

        // 2. ĐÁNH SỐ CHẴN - LẺ NHÀ HÁT (ODD_EVEN_SPLIT)
        if (mode === NUMBERING_MODES.ODD_EVEN_SPLIT) {
            const splitAt = Math.ceil(cols / 2);

            const leftSeats = targetSeats.filter((s) => s.col < splitAt);
            const rightSeats = targetSeats.filter((s) => s.col >= splitAt);

            const leftNumbers = generateNumbers(leftSeats.length, 2, 1, skipSet); // 1, 3, 5...
            const rightNumbers = generateNumbers(rightSeats.length, 2, 2, skipSet); // 2, 4, 6...

            leftSeats.forEach((seat, idx) => {
                numberMap.set(seat.key, String(leftNumbers[idx]));
            });

            rightSeats.forEach((seat, idx) => {
                numberMap.set(seat.key, String(rightNumbers[idx]));
            });
            continue;
        }

        // 3. TÙY CHỈNH (CUSTOM)
        if (mode === NUMBERING_MODES.CUSTOM) {
            const labels = numberingConfig.labels || {};
            targetSeats.forEach((seat, idx) => {
                const customLabel = labels[seat.key];
                numberMap.set(
                    seat.key,
                    customLabel !== undefined && customLabel !== null
                        ? String(customLabel)
                        : String(idx + 1)
                );
            });
        }
    }

    return numberMap;
}