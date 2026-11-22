/**
 * ============================================================
 * KEY & NHÃN HÀNG CỦA Ô GHẾ
 * ============================================================
 *
 * Nguồn duy nhất cho các phép toán trên "key" của ô ghế.
 * Tách riêng để tránh vòng import giữa seatNumbering và
 * seatLayout (cả hai đều cần dùng).
 *
 * - key: toạ độ gốc, ví dụ "A|3" (hàng A, cột 3).
 * - seatNumber: số hiển thị trên ghế, CÓ THỂ thay đổi khi
 *   đánh số lại. Không dùng seatNumber làm key.
 */

/**
 * Chuẩn hóa danh sách key thành Set.
 *
 * @param {string[]} keys
 * @returns {Set<string>}
 */
export function createKeySet(keys) {
    return new Set(
        Array.isArray(keys)
            ? keys.map((key) => String(key ?? "").trim())
            : []
    );
}

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
 * Khoá duy nhất cho một ô trong lưới.
 *
 * rowIndex = 0, colIndex = 0 -> "A|1"
 * rowIndex = 1, colIndex = 2 -> "B|3"
 *
 * @param {number} rowIndex  0-based
 * @param {number} colIndex  0-based
 * @returns {string}
 */
export function seatKey(rowIndex, colIndex) {
    return `${rowLabelToLetters(rowIndex + 1)}|${colIndex + 1}`;
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
