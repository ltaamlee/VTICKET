/**
 * ============================================================
 * TOÁ ĐỘ CANVAS (KONVA)
 * ============================================================
 *
 * Tiện ích chuyển đổi toạ độ giữa:
 *  - Stage (pixel màn hình, đã áp zoom/pan)
 *  - Canvas (toạ độ logic của sơ đồ, 0..canvasWidth)
 *
 * Trong React Konva, mọi toạ độ sự kiện đều được trả về theo
 * toạ độ "absolute" của node (tức đã bỏ qua transform của
 * chính node nhưng vẫn còn transform của Stage).
 */

/**
 * Chuyển toạ độ Stage (pixel) sang toạ độ canvas.
 *
 * @param {Konva.Stage} stage
 * @param {{x:number,y:number}} pointer toạ độ con trỏ trên stage
 * @returns {{x:number,y:number}} toạ độ trên canvas
 */
function stageToCanvasPoint(stage, pointer) {
    if (!stage || !pointer) return { x: 0, y: 0 };

    const transform = stage.getAbsoluteTransform().copy();

    transform.invert();

    const point = transform.point(pointer);

    return { x: point.x, y: point.y };
}

/**
 * Lấy toạ độ con trỏ hiện tại trên canvas.
 */
export function getCanvasPointer(stage) {
    if (!stage) return { x: 0, y: 0 };

    const pointer = stage.getPointerPosition();

    return stageToCanvasPoint(stage, pointer);
}

/**
 * Tạo hình chữ nhật từ 2 điểm (dùng cho vùng kéo chọn).
 */
export function rectFromPoints(start, end) {
    return {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
    };
}

/**
 * Khoảng cách góc (độ) giữa 2 vector từ tâm.
 */
export function angleBetween(center, point) {
    return (
        (Math.atan2(point.y - center.y, point.x - center.x) * 180) /
        Math.PI
    );
}

/**
 * Chuẩn hoá góc về khoảng (-180, 180].
 */
export function normalizeAngle(angle) {
    return (((angle + 180) % 360) + 360) % 360 - 180;
}
