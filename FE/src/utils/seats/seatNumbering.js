/**
 * ============================================================
 * ĐÁNH SỐ GHẾ
 * ============================================================
 *
 * Các chế độ đánh số:
 * - SEQUENTIAL: Đánh số tuần tự trong từng hàng.
 * - ODD_EVEN_SPLIT: Một phía lẻ, một phía chẵn.
 * - CUSTOM: Đánh số theo cấu hình riêng từng vị trí.
 *
 * Phân biệt:
 * - key: toạ độ gốc, ví dụ A|3 (xem seatKeys.js).
 * - seatNumber: số hiển thị trên ghế, có thể thay đổi.
 */

import { createKeySet, rowLabelToLetters } from "./seatKeys";

export const NUMBERING_MODES = {
    SEQUENTIAL: "SEQUENTIAL",
    ODD_EVEN_SPLIT: "ODD_EVEN_SPLIT",
    CUSTOM: "CUSTOM",
};

/**
 * Tạo nhãn hàng cho lưới ghế.
 * rowIndex: 0-based.
 */
export function buildRowLabel(rowIndex) {
    return rowLabelToLetters(rowIndex + 1);
}

/**
 * Tạo bản đồ số ghế theo vị trí.
 *
 * SEQUENTIAL:
 * - Mỗi hàng bắt đầu từ 1.
 * - Bỏ qua ghế đã xóa.
 *
 * ODD_EVEN_SPLIT:
 * - Chia hai phía theo splitAt.
 * - Bên trái mặc định số lẻ.
 * - Bên phải mặc định số chẵn.
 * - Hai phía đánh số độc lập.
 *
 * CUSTOM:
 * - Lấy nhãn từ numberingConfig.labels.
 * - Key theo toạ độ gốc, ví dụ A|1.
 *
 * @returns {Map<string, string>}
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

    for (let row = 0; row < rows; row += 1) {
        const rowLabel = buildRowLabel(row);

        const availableSeats = [];

        for (let col = 0; col < cols; col += 1) {
            const key = `${rowLabel}|${col + 1}`;

            if (removed.has(key)) continue;

            availableSeats.push({
                key,
                row,
                col,
            });
        }

        // 1. Đánh số tuần tự.
        if (mode === NUMBERING_MODES.SEQUENTIAL) {
            availableSeats.forEach((seat, index) => {
                numberMap.set(seat.key, String(index + 1));
            });

            continue;
        }

        // 2. Đánh số lẻ / chẵn hai phía.
        if (mode === NUMBERING_MODES.ODD_EVEN_SPLIT) {
            const configuredSplit = Number(numberingConfig.splitAt);

            const splitAt = Number.isFinite(configuredSplit)
                ? Math.max(0, Math.min(cols, Math.floor(configuredSplit)))
                : Math.ceil(cols / 2);

            const leftSide = availableSeats.filter(
                (seat) => seat.col < splitAt
            );

            const rightSide = availableSeats.filter(
                (seat) => seat.col >= splitAt
            );

            const leftStart =
                numberingConfig.leftSide === "EVEN" ? 2 : 1;

            const rightStart = leftStart === 1 ? 2 : 1;

            leftSide.forEach((seat, index) => {
                numberMap.set(
                    seat.key,
                    String(leftStart + index * 2)
                );
            });

            rightSide.forEach((seat, index) => {
                numberMap.set(
                    seat.key,
                    String(rightStart + index * 2)
                );
            });

            continue;
        }

        // 3. Đánh số tùy chỉnh.
        if (mode === NUMBERING_MODES.CUSTOM) {
            const labels = numberingConfig.labels || {};

            availableSeats.forEach((seat, index) => {
                const customLabel = labels[seat.key];

                // Nếu chưa cấu hình nhãn thì tạm dùng số tuần tự.
                numberMap.set(
                    seat.key,
                    customLabel !== undefined && customLabel !== null
                        ? String(customLabel)
                        : String(index + 1)
                );
            });
        }
    }

    return numberMap;
}
