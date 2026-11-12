/**
 * Tính con trỏ chuột cho tay nắm kéo dãn, có xét góc xoay của shape.
 *
 * Giống Figma: khi khung đã xoay 45°, tay nắm cạnh phải ("e") nằm ở
 * góc chéo, nên con trỏ phải là "nesw-resize" chứ không phải "e-resize".
 * CSS không có cursor động theo góc, nên ta chọn cursor gần đúng nhất
 * trong 4 hướng chẵn.
 */

// 4 hướng chẵn (góc chuẩn trong 0..180°), kèm cursor tương ứng.
const AXIS_CURSORS = [
    { angle: 0, cursor: "ew-resize" }, // ngang
    { angle: 45, cursor: "nesw-resize" }, // chéo "\"
    { angle: 90, cursor: "ns-resize" }, // dọc
    { angle: 135, cursor: "nwse-resize" }, // chéo "/"
];

// Góc của từng tay nắm trong hệ toạ độ cục bộ của shape.
// (0° = hướng đông, góc tăng theo chiều kim đồng hồ trên màn hình)
const HANDLE_ANGLES = {
    e: 0,
    se: 45,
    s: 90,
    sw: 135,
    w: 180,
    nw: 225,
    n: 270,
    ne: 315,
};

/**
 * @param {string} handle - id tay nắm: nw, n, ne, e, se, s, sw, w
 * @param {number} rotation - góc xoay của shape (độ)
 * @returns {string} cursor CSS
 */
export function getResizeCursor(handle, rotation = 0) {
    const base = HANDLE_ANGLES[handle];

    if (base === undefined) return "default";

    // Góc tuyệt đối của tay nắm, chuẩn hoá về [0, 360).
    const angle = (((base + (Number(rotation) || 0)) % 360) + 360) % 360;

    // Cursor theo trục không phân biệt chiều -> góc chuẩn hoá về [0, 180).
    const normalized = angle % 180;

    let best = AXIS_CURSORS[0];
    let bestDiff = Infinity;

    AXIS_CURSORS.forEach((item) => {
        const diff = Math.min(
            Math.abs(normalized - item.angle),
            180 - Math.abs(normalized - item.angle)
        );

        if (diff < bestDiff) {
            bestDiff = diff;
            best = item;
        }
    });

    return best.cursor;
}

export default getResizeCursor;
