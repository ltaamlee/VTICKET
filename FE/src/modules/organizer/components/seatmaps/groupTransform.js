/**
 * ============================================================
 * XOAY / DÃN THEO NHÓM
 * ============================================================
 * Khi nhiều khu vực được gom nhóm (groupId), thao tác xoay hoặc
 * kéo dãn trên 1 thành viên sẽ áp dụng cho TẤT CẢ thành viên
 * trong nhóm - giống cách Figma/Penpot xử lý group.
 *
 * Nguyên tắc:
 *  - Xoay: mọi thành viên xoay quanh TÂM của cả nhóm, giữ nguyên
 *    khoảng cách tương đối với nhau.
 *  - Dãn: mọi thành viên được scale theo tỉ lệ của nhóm, quanh
 *    tâm của nhóm, đồng thời vị trí cũng được scale tương ứng.
 */

import { getZoneBounds } from "./canvasGeometry";

/**
 * Tâm của hộp bao trọn cả nhóm.
 */
export function getGroupCenter(zones) {
    if (!zones?.length) return { x: 0, y: 0 };

    const bounds = zones.map(getZoneBounds);

    const minX = Math.min(...bounds.map((b) => b.x));
    const minY = Math.min(...bounds.map((b) => b.y));
    const maxX = Math.max(...bounds.map((b) => b.right));
    const maxY = Math.max(...bounds.map((b) => b.bottom));

    return {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
    };
}

/**
 * Xoay toàn bộ nhóm quanh tâm nhóm.
 *
 * @param {Array} zones   Danh sách zone của nhóm (đã lọc).
 * @param {number} angle  Góc xoay (độ) tính từ vị trí gốc.
 * @param {{x:number,y:number}} center  Tâm xoay.
 * @returns {Array} Danh sách zone mới.
 */
export function rotateGroup(zones, angle, center) {
    const rad = (angle * Math.PI) / 180;

    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return zones.map((zone) => {
        // Xoay tâm của zone quanh tâm nhóm.
        const cx = zone.posX + zone.width / 2;
        const cy = zone.posY + zone.height / 2;

        const dx = cx - center.x;
        const dy = cy - center.y;

        const newCx = center.x + dx * cos - dy * sin;
        const newCy = center.y + dx * sin + dy * cos;

        // Góc xoay của chính zone đó cũng cộng thêm.
        const nextRotation =
            ((Number(zone.rotation) || 0) + angle + 360) % 360;

        return {
            ...zone,
            posX: Math.round(newCx - zone.width / 2),
            posY: Math.round(newCy - zone.height / 2),
            rotation: Math.round(nextRotation),
        };
    });
}

/**
 * Dãn toàn bộ nhóm theo tỉ lệ.
 *
 * @param {Array} zones   Danh sách zone của nhóm.
 * @param {number} scaleX  Hệ số theo trục X.
 * @param {number} scaleY  Hệ số theo trục Y.
 * @param {{x:number,y:number}} center  Tâm giữ nguyên.
 * @param {{x:number,y:number}} [anchor] Điểm neo (góc/cạnh đối diện với
 *        tay nắm đang kéo) - nếu có, neo này đứng yên khi dãn.
 * @returns {Array} Danh sách zone mới.
 */
export function scaleGroup(zones, scaleX, scaleY, center, anchor = null) {
    // Điểm tâm quanh đó mọi thành viên được scale.
    const pivot = anchor || center;

    return zones.map((zone) => {
        const width = Math.max(1, zone.width * scaleX);
        const height = Math.max(1, zone.height * scaleY);

        // Tâm zone sau khi dãn (quanh điểm neo).
        const cx = zone.posX + zone.width / 2;
        const cy = zone.posY + zone.height / 2;

        const newCx = pivot.x + (cx - pivot.x) * scaleX;
        const newCy = pivot.y + (cy - pivot.y) * scaleY;

        const patch = {
            posX: Math.round(newCx - width / 2),
            posY: Math.round(newCy - height / 2),
            width: Math.round(width),
            height: Math.round(height),
        };

        // Đa giác: scale lại các đỉnh cho khớp kích thước mới.
        if (
            zone.shape === "POLYGON" &&
            Array.isArray(zone.points) &&
            zone.points.length >= 3
        ) {
            const ratioX = patch.width / (zone.width || 1);
            const ratioY = patch.height / (zone.height || 1);

            patch.points = zone.points.map((p) => ({
                x: Math.max(0, Math.min(p.x * ratioX, patch.width)),
                y: Math.max(0, Math.min(p.y * ratioY, patch.height)),
            }));

            if (Array.isArray(zone.holes)) {
                patch.holes = zone.holes.map((hole) =>
                    hole.map((p) => ({
                        x: Math.max(
                            0,
                            Math.min(p.x * ratioX, patch.width)
                        ),
                        y: Math.max(
                            0,
                            Math.min(p.y * ratioY, patch.height)
                        ),
                    }))
                );
            }
        }

        return { ...zone, ...patch };
    });
}
