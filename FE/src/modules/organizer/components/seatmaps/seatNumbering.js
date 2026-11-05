
export const NUMBERING_MODES = {
    SEQUENTIAL: "SEQUENTIAL",
    ODD_EVEN_SPLIT: "ODD_EVEN_SPLIT",
    CUSTOM: "CUSTOM",
};

/**
 * Chuyển số thứ tự hàng (1-based) sang chữ cái:
 * 1 -> A, 26 -> Z, 27 -> AA.
 */
export function rowLabelToLetters(rowIndex) {
    const n = Math.max(1, Math.floor(Number(rowIndex) || 0));

    let label = "";
    let value = n;

    while (value > 0) {
        const remainder = (value - 1) % 26;

        label = String.fromCharCode(65 + remainder) + label;
        value = Math.floor((value - 1) / 26);
    }

    return label || "A";
}

/**
 * Chuyển chữ cái sang số thứ tự hàng:
 * A -> 1, Z -> 26, AA -> 27.
 */
export function lettersToRowLabel(label) {
    const text = String(label || "")
        .trim()
        .toUpperCase();

    if (!/^[A-Z]+$/.test(text)) return 0;

    let value = 0;

    for (let i = 0; i < text.length; i += 1) {
        value = value * 26 + (text.charCodeAt(i) - 64);
    }

    return value;
}

/**
 * Chuyển key cũ dạng số hàng sang chữ cái.
 *
 * Ví dụ:
 * "1|3" -> "A|3"
 * "2|5" -> "B|5"
 */
export function convertSeatKeys(keys) {
    if (!Array.isArray(keys)) return [];

    const converted = keys.map((key) => {
        const text = String(key ?? "").trim();
        const [rowPart, colPart] = text.split("|");

        if (!rowPart || !colPart) return text;

        if (/^[A-Za-z]+$/.test(rowPart)) return text;

        const rowNumber = Number(rowPart);

        if (!Number.isFinite(rowNumber) || rowNumber < 1) {
            return text;
        }

        return `${rowLabelToLetters(rowNumber)}|${colPart}`;
    });

    return [...new Set(converted)];
}

/**
 * Tạo nhãn hàng cho lưới ghế.
 * rowIndex: 0-based.
 */
export function buildRowLabel(rowIndex) {
    return rowLabelToLetters(rowIndex + 1);
}

/**
 * Chuyển danh sách thành Set key.
 */
function createKeySet(keys) {
    return new Set(
        Array.isArray(keys)
            ? keys.map((key) => String(key ?? "").trim())
            : []
    );
}

/**
 * Lấy thứ tự hàng để sắp xếp.
 */
function getRowOrder(seat) {
    if (Number.isFinite(Number(seat?.row))) {
        return Number(seat.row);
    }

    const letters = lettersToRowLabel(seat?.rowLabel);

    if (letters > 0) return letters - 1;

    const number = Number(seat?.rowLabel);

    return Number.isFinite(number) ? number - 1 : 0;
}

/**
 * Lấy thứ tự cột theo vị trí thực tế.
 *
 * Ưu tiên col vì seatNumber có thể đã được đánh số lại
 * hoặc là nhãn custom.
 */
function getColumnOrder(seat) {
    if (Number.isFinite(Number(seat?.col))) {
        return Number(seat.col);
    }

    const key = String(seat?.key || "");
    const colFromKey = Number(key.split("|")[1]);

    if (Number.isFinite(colFromKey) && colFromKey > 0) {
        return colFromKey - 1;
    }

    const seatNumber = Number(seat?.seatNumber);

    return Number.isFinite(seatNumber) ? seatNumber - 1 : 0;
}

/**
 * Sắp xếp ghế theo thứ tự duyệt.
 *
 * direction:
 * - row: trái sang phải, trên xuống dưới.
 * - column: trên xuống dưới, trái sang phải.
 *
 * Lưu ý: sắp xếp theo tọa độ thực tế, không phụ thuộc
 * số ghế hiển thị.
 */
export function sortSeatsByNumbering(seats, direction = "row") {
    const list = Array.isArray(seats) ? [...seats] : [];

    list.sort((a, b) => {
        const rowA = getRowOrder(a);
        const rowB = getRowOrder(b);

        const colA = getColumnOrder(a);
        const colB = getColumnOrder(b);

        if (direction === "column") {
            if (colA !== colB) return colA - colB;

            return rowA - rowB;
        }

        if (rowA !== rowB) return rowA - rowB;

        return colA - colB;
    });

    return list;
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
 * - Key theo tọa độ gốc, ví dụ A|1.
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

/**
 * Sinh danh sách ghế hoàn chỉnh.
 *
 * key: tọa độ gốc, không thay đổi khi đánh số lại.
 * seatNumber: số hiển thị.
 * order: thứ tự duyệt ghế.
 */
export function buildNumberedSeats({
    rowCount = 0,
    seatPerRow = 0,
    removedSeats = [],
    blockedSeats = [],
    direction = "row",
    numberingMode = NUMBERING_MODES.SEQUENTIAL,
    numberingConfig = {},
}) {
    const rows = Math.max(0, Number(rowCount) || 0);
    const cols = Math.max(0, Number(seatPerRow) || 0);

    const blocked = createKeySet(blockedSeats);

    const numberMap = buildSeatNumberMap({
        rowCount: rows,
        seatPerRow: cols,
        removedSeats,
        numberingMode,
        numberingConfig,
    });

    const seats = [];

    for (let row = 0; row < rows; row += 1) {
        const rowLabel = buildRowLabel(row);

        for (let col = 0; col < cols; col += 1) {
            const key = `${rowLabel}|${col + 1}`;

            // Không tạo ghế đã xóa.
            if (!numberMap.has(key)) continue;

            seats.push({
                key,
                rowLabel,
                seatNumber: numberMap.get(key),
                row,
                col,
                blocked: blocked.has(key),
            });
        }
    }

    const sorted = sortSeatsByNumbering(seats, direction);

    return sorted.map((seat, index) => ({
        ...seat,
        order: index + 1,
    }));
}