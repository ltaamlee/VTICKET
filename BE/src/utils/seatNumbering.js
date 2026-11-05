/**
 * ============================================================
 * ĐÁNH SỐ GHẾ - HÀNG DÙNG CHỮ CÁI
 * ============================================================
 * Hàng: A, B, C, ... (Z, AA, AB, ...)
 * Cột: 1, 2, 3, ...
 *
 * Chiều duyệt ghế khi trả vé ngẫu nhiên:
 *  - "ROW"    -> duyệt theo hàng: A1, A2, A3, B1, B2, ...
 *  - "COLUMN" -> duyệt theo cột: A1, B1, C1, A2, B2, ...
 *
 * Khi khách mua nhiều vé, hệ thống xáo trộn trong nhóm ghế liên
 * tiếp theo chiều đã chọn -> các ghế luôn nằm gần nhau, giảm
 * khả năng sai sót khi khách tìm chỗ ngồi.
 */

/** Chuyển số thứ tự hàng (1-based) sang chữ cái: 1 -> A, 27 -> AA. */
function rowLabelToLetters(rowIndex) {
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

/** Chuyển chữ cái sang số thứ tự hàng: A -> 1, AA -> 27. */
function lettersToRowLabel(label) {
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
 * Chuyển khoá ghế từ kiểu cũ (hàng dùng SỐ) sang kiểu mới
 * (hàng dùng CHỮ CÁI). Khoá đã đúng kiểu mới thì giữ nguyên.
 *
 * @param {Array} keys
 * @returns {Array}
 */
function convertSeatKeys(keys) {
    if (!Array.isArray(keys)) return [];

    const converted = keys.map((key) => {
        const text = String(key ?? "").trim();

        const [rowPart, colPart] = text.split("|");

        if (!rowPart || !colPart) return text;

        // Hàng đã là chữ cái -> giữ nguyên.
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
 * Lấy số thứ tự hàng từ nhãn (chữ cái hoặc số).
 */
function getRowOrder(rowLabel) {
    const letters = lettersToRowLabel(rowLabel);

    if (letters > 0) return letters;

    const num = Number(rowLabel);

    return Number.isFinite(num) && num > 0 ? num : 0;
}

/**
 * Sắp xếp ghế theo chiều duyệt đã chọn.
 *
 * @param {Array} seats  Ghế có rowLabel & seatNumber.
 * @param {"ROW"|"COLUMN"} direction
 * @returns {Array} Bản sao đã sắp xếp.
 */
function sortSeatsByNumbering(seats, direction = "ROW") {
    const list = Array.isArray(seats) ? [...seats] : [];

    const colOf = (seat) => {
        const num = Number(seat?.seatNumber);

        return Number.isFinite(num) ? num : 0;
    };

    list.sort((a, b) => {
        const rowA = getRowOrder(a?.rowLabel);
        const rowB = getRowOrder(b?.rowLabel);
        const colA = colOf(a);
        const colB = colOf(b);

        if (direction === "COLUMN") {
            // Theo cột: cột trước, trong cột thì hàng tăng dần.
            if (colA !== colB) return colA - colB;

            return rowA - rowB;
        }

        // Theo hàng: hàng trước, trong hàng thì cột tăng dần.
        if (rowA !== rowB) return rowA - rowB;

        return colA - colB;
    });

    return list;
}

module.exports = {
    rowLabelToLetters,
    lettersToRowLabel,
    convertSeatKeys,
    sortSeatsByNumbering,
    getRowOrder,
};