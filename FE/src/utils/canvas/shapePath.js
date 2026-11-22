/**
 * ============================================================
 * CHUYỂN HÌNH ZONE THÀNH PATH
 * ============================================================
 *
 * Cả React Konva (`Path`) và preview SVG đều dùng chung cú
 * pháp path SVG, nên chỉ cần MỘT hàm dựng path cho cả hai.
 *
 * Vì Konva không hỗ trợ "đường bao có lỗ" bằng fill thuần, ta
 * gộp cả vòng ngoài lẫn các lỗ vào cùng path rồi dùng
 * `fillRule="evenodd"` - vùng bị bao phủ 2 lần sẽ trống.
 */

import { buildShape } from "./shapeGeometry";

/**
 * Dựng path SVG từ dữ liệu hình của zone.
 *
 * @param {object} data      Kết quả của buildShape().
 * @param {object} [offset]  Dịch toạ độ (dùng cho preview SVG).
 * @param {boolean} [clampRadius] Giới hạn bán kính bo góc không
 *        vượt quá nửa cạnh (dùng cho Konva để tránh lỗi render).
 *
 * @returns {string} chuỗi path ("" nếu hình không hợp lệ)
 */
export function buildShapePath(data, offset = {}, clampRadius = false) {
    const ox = Number(offset.x) || 0;
    const oy = Number(offset.y) || 0;

    const parts = [];

    if (data.tag === "rect") {
        const rawRx = data.rx || 0;

        const rx = clampRadius
            ? Math.min(rawRx, data.width / 2)
            : rawRx;

        const ry = clampRadius
            ? Math.min(data.ry || rawRx, data.height / 2)
            : data.ry || rawRx;

        parts.push(
            `M ${data.x + rx + ox} ${data.y + oy} ` +
                `H ${data.x + data.width - rx + ox} ` +
                `A ${rx} ${ry} 0 0 1 ${data.x + data.width + ox} ${data.y + ry + oy} ` +
                `V ${data.y + data.height - ry + oy} ` +
                `A ${rx} ${ry} 0 0 1 ${data.x + data.width - rx + ox} ${data.y + data.height + oy} ` +
                `H ${data.x + rx + ox} ` +
                `A ${rx} ${ry} 0 0 1 ${data.x + ox} ${data.y + data.height - ry + oy} ` +
                `V ${data.y + ry + oy} ` +
                `A ${rx} ${ry} 0 0 1 ${data.x + rx + ox} ${data.y + oy} Z`
        );
    } else if (data.tag === "ellipse") {
        parts.push(
            `M ${data.cx - data.rx + ox} ${data.cy + oy} ` +
                `a ${data.rx} ${data.ry} 0 1 0 ${data.rx * 2} 0 ` +
                `a ${data.rx} ${data.ry} 0 1 0 ${-data.rx * 2} 0 Z`
        );
    } else {
        const pts = data.points || [];

        if (pts.length >= 3) {
            parts.push(
                `M ${pts
                    .map(([x, y]) => `${x + ox} ${y + oy}`)
                    .join(" L ")} Z`
            );
        }
    }

    // Các lỗ (hình rỗng) được nối tiếp trong cùng path.
    (data.holes || []).forEach((hole) => {
        const pts = Array.isArray(hole) ? hole : hole?.points || [];

        if (pts.length < 3) return;

        parts.push(
            `M ${pts
                .map(([x, y]) => `${x + ox} ${y + oy}`)
                .join(" L ")} Z`
        );
    });

    return parts.join(" ");
}

/**
 * Dựng path trực tiếp từ một zone (tiện cho Konva).
 *
 * @param {object} zone
 * @returns {string}
 */
export function buildZonePath(zone) {
    const width = Math.max(Number(zone?.width) || 0, 1);
    const height = Math.max(Number(zone?.height) || 0, 1);

    const data = buildShape({
        shape: zone?.shape,
        width,
        height,
        points: zone?.points,
        holes: zone?.holes,
    });

    return buildShapePath(data, {}, true);
}

/**
 * Zone có lỗ (hình rỗng) hay không - cần dùng fillRule evenodd.
 */
export function zoneHasHoles(zone) {
    const holes = zone?.holes;

    if (!Array.isArray(holes)) return false;

    return holes.some((hole) => {
        const pts = Array.isArray(hole) ? hole : hole?.points;

        return Array.isArray(pts) && pts.length >= 3;
    });
}
