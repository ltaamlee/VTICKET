function getZoneBounds(zone) {
    return {
        x: Number(zone.posX) || 0,
        y: Number(zone.posY) || 0,
        width: Number(zone.width) || 0,
        height: Number(zone.height) || 0,
        right: (Number(zone.posX) || 0) + (Number(zone.width) || 0),
        bottom:
            (Number(zone.posY) || 0) + (Number(zone.height) || 0),
    };
}

/**
 * Scale lại danh sách đỉnh đa giác theo tỉ lệ mới.
 *
 * Dùng chung cho:
 *  - Dãn khu vực (groupTransform.js)
 *  - Đổi kích thước bằng tay (ZonePropertiesPanel.jsx)
 *
 * @param {Array<{x:number,y:number}>} points
 * @param {number} ratioX
 * @param {number} ratioY
 * @param {number} maxX  giới hạn toạ độ X (bề rộng mới)
 * @param {number} maxY  giới hạn toạ độ Y (chiều cao mới)
 */
export function scalePolygonPoints(
    points,
    ratioX,
    ratioY,
    maxX,
    maxY
) {
    if (!Array.isArray(points)) return points;

    return points.map((p) => {
        const px = Array.isArray(p) ? Number(p[0]) || 0 : Number(p?.x) || 0;
        const py = Array.isArray(p) ? Number(p[1]) || 0 : Number(p?.y) || 0;

        return {
            x: Math.max(0, Math.min(Math.round(px * ratioX * 10) / 10, maxX)),
            y: Math.max(0, Math.min(Math.round(py * ratioY * 10) / 10, maxY)),
        };
    });
}

/** Bounding box bao trọn nhiều zone. */
export function getSelectionBounds(zones) {
    if (!zones || zones.length === 0) return null;

    const bounds = zones.map(getZoneBounds);

    const minX = Math.min(...bounds.map((b) => b.x));
    const minY = Math.min(...bounds.map((b) => b.y));
    const maxX = Math.max(...bounds.map((b) => b.right));
    const maxY = Math.max(...bounds.map((b) => b.bottom));

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        right: maxX,
        bottom: maxY,
    };
}

export function groupZones(zones, selectedIds, groupId) {
    const idSet = new Set(selectedIds);

    return zones.map((zone) =>
        idSet.has(zone.id)
            ? { ...zone, groupId }
            : zone
    );
}

/**
 * Bỏ nhóm cho các zone đang chọn.
 * Nhóm chỉ được bỏ khi bỏ nhóm đủ các thành viên,
 * nếu không thì cả nhóm cùng được giải phóng.
 */
export function ungroupZones(zones, selectedIds) {
    const idSet = new Set(selectedIds);

    // Tập groupId của các zone đang chọn.
    const groupIds = new Set(
        zones
            .filter((zone) => idSet.has(zone.id) && zone.groupId)
            .map((zone) => zone.groupId)
    );

    return zones.map((zone) => {
        if (groupIds.has(zone.groupId)) {
            return { ...zone, groupId: null };
        }

        return zone;
    });
}

/**
 * Căn lề các zone đang chọn theo hướng.
 *
 * - Chọn từ 2 hình trở lên: căn theo khung bao của nhóm đang chọn.
 * - Chọn đúng 1 hình: căn theo khung CANVAS (trái/phải/trên/dưới/giữa
 *   canvas) - đây là hành vi "căn cho từng hình" mà không cần chọn
 *   nhiều đối tượng.
 *
 * @param {'left'|'center-h'|'right'|'top'|'center-v'|'bottom'} alignment
 * @param {{x:number,y:number,width:number,height:number}} [frame]
 *        Khung tham chiếu. Mặc định = khung bao của nhóm đang chọn.
 */
export function alignZones(zones, selectedIds, alignment, frame) {
    const idSet = new Set(selectedIds);

    const selected = zones.filter((zone) => idSet.has(zone.id));

    if (selected.length === 0) return zones;

    // Chọn 1 hình -> căn theo canvas (nếu có khung tham chiếu).
    const reference =
        selected.length === 1 && frame
            ? frame
            : getSelectionBounds(selected);

    if (!reference) return zones;

    return zones.map((zone) => {
        if (!idSet.has(zone.id)) return zone;

        const b = getZoneBounds(zone);

        switch (alignment) {
            case "left":
                return { ...zone, posX: reference.x };

            case "center-h":
                return {
                    ...zone,
                    posX: Math.round(
                        reference.x + (reference.width - b.width) / 2
                    ),
                };

            case "right":
                return {
                    ...zone,
                    posX: Math.round(reference.right - b.width),
                };

            case "top":
                return { ...zone, posY: reference.y };

            case "center-v":
                return {
                    ...zone,
                    posY: Math.round(
                        reference.y + (reference.height - b.height) / 2
                    ),
                };

            case "bottom":
                return {
                    ...zone,
                    posY: Math.round(reference.bottom - b.height),
                };

            default:
                return zone;
        }
    });
}

/**
 * Phân bố đều các zone đang chọn theo trục.
 * @param {'horizontal'|'vertical'} direction
 */
export function distributeZones(zones, selectedIds, direction) {
    const idSet = new Set(selectedIds);

    const selected = zones.filter((zone) => idSet.has(zone.id));

    // Cần ít nhất 3 zone mới phân bố có ý nghĩa.
    if (selected.length < 3) return zones;

    const isHorizontal = direction === "horizontal";

    const sorted = [...selected].sort((a, b) =>
        isHorizontal
            ? getZoneBounds(a).x - getZoneBounds(b).x
            : getZoneBounds(a).y - getZoneBounds(b).y
    );

    const first = getZoneBounds(sorted[0]);
    const last = getZoneBounds(sorted[sorted.length - 1]);

    // Tổng khoảng cách giữa các khoảng trống.
    const totalSize = sorted.reduce((sum, zone) => {
        const b = getZoneBounds(zone);

        return sum + (isHorizontal ? b.width : b.height);
    }, 0);

    const span = isHorizontal
        ? last.right - first.x
        : last.bottom - first.y;

    const gap = (span - totalSize) / (sorted.length - 1);

    const positions = new Map();

    let cursor = isHorizontal ? first.x : first.y;

    sorted.forEach((zone) => {
        const b = getZoneBounds(zone);

        positions.set(
            zone.id,
            Math.round(cursor)
        );

        cursor +=
            (isHorizontal ? b.width : b.height) + gap;
    });

    return zones.map((zone) => {
        if (!positions.has(zone.id)) return zone;

        return isHorizontal
            ? { ...zone, posX: positions.get(zone.id) }
            : { ...zone, posY: positions.get(zone.id) };
    });
}

/**
 * Đổi thứ tự hiển thị (z-order).
 * @param {'front'|'back'|'forward'|'backward'} action
 */
export function reorderZones(zones, selectedIds, action) {
    const idSet = new Set(selectedIds);

    const sorted = [...zones].sort(
        (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
    );

    if (action === "front" || action === "back") {
        const moving = sorted.filter((z) => idSet.has(z.id));
        const staying = sorted.filter((z) => !idSet.has(z.id));

        const reordered =
            action === "front"
                ? [...staying, ...moving]
                : [...moving, ...staying];

        const zMap = new Map();

        reordered.forEach((zone, index) => {
            zMap.set(zone.id, index);
        });

        return zones.map((zone) => ({
            ...zone,
            zIndex: zMap.get(zone.id) ?? zone.zIndex ?? 0,
        }));
    }

    // forward / backward: đổi chỗ với zone liền kề.
    const next = sorted.map((z) => ({ ...z }));

    const indices = next
        .map((zone, index) => ({ zone, index }))
        .filter(({ zone }) => idSet.has(zone.id))
        .map(({ index }) => index);

    if (indices.length === 0) return zones;

    if (action === "forward") {
        // Đưa lên: duyệt từ trên xuống.
        for (let i = indices.length - 1; i >= 0; i -= 1) {
            const idx = indices[i];

            if (idx < next.length - 1) {
                const tmp = next[idx];

                next[idx] = next[idx + 1];
                next[idx + 1] = tmp;
            }
        }
    } else {
        // Đưa xuống: duyệt từ dưới lên.
        for (let i = 0; i < indices.length; i += 1) {
            const idx = indices[i];

            if (idx > 0) {
                const tmp = next[idx];

                next[idx] = next[idx - 1];
                next[idx - 1] = tmp;
            }
        }
    }

    const zMap = new Map();

    next.forEach((zone, index) => {
        zMap.set(zone.id, index);
    });

    return zones.map((zone) => ({
        ...zone,
        zIndex: zMap.get(zone.id) ?? zone.zIndex ?? 0,
    }));
}

/**
 * Căn chỉnh lại lưới ghế của một khu vực.
 *
 * Mục tiêu: mọi ô ghế phải VUÔNG và BẰNG NHAU nhau, kể cả khi
 * kích thước zone không cân đối (ví dụ 4 hàng x 8 ghế trong ô
 * 160x110 -> ô sẽ là 20x27, méo). Hàm này:
 *  - chọn cạnh ô vuông = floor(min(width / cols, height / rows))
 *  - đặt lại width / height của zone sao cho lưới vừa khít,
 *    không còn khoảng trống thừa
 *  - giữ nguyên tâm zone (để không bị "nhảy" khi bấm nút)
 *
 * @param {object} zone
 * @returns {object} zone đã căn lại (trả về zone gốc nếu không hợp lệ)
 */
export function fitSeatGrid(zone) {
    if (!zone || zone.type !== "SEATED") return zone;

    const rows = Math.max(0, Number(zone.rowCount) || 0);
    const cols = Math.max(0, Number(zone.seatPerRow) || 0);

    if (rows === 0 || cols === 0) return zone;

    const width = Math.max(0, Number(zone.width) || 0);
    const height = Math.max(0, Number(zone.height) || 0);

    // Cạnh ô vuông, làm tròn xuống để không bị tràn ra ngoài zone.
    const cell = Math.max(
        4,
        Math.floor(Math.min(width / cols, height / rows))
    );

    const newWidth = cell * cols;
    const newHeight = cell * rows;

    if (newWidth === width && newHeight === height) return zone;

    // Giữ nguyên tâm khối khi đổi kích thước.
    const centerX = (Number(zone.posX) || 0) + width / 2;
    const centerY = (Number(zone.posY) || 0) + height / 2;

    return {
        ...zone,
        width: newWidth,
        height: newHeight,
        posX: Math.round(centerX - newWidth / 2),
        posY: Math.round(centerY - newHeight / 2),
    };
}

/**
 * Lật gương zone theo trục.
 * Với đa giác thì đảo toạ độ các đỉnh, các hình khác dùng scale CSS.
 */
export function flipZones(zones, selectedIds, axis) {
    const idSet = new Set(selectedIds);

    return zones.map((zone) => {
        if (!idSet.has(zone.id)) return zone;

        if (
            zone.shape === "POLYGON" &&
            Array.isArray(zone.points) &&
            zone.points.length >= 3
        ) {
            const width = Number(zone.width) || 0;
            const height = Number(zone.height) || 0;

            const flipped = zone.points.map((p) =>
                axis === "horizontal"
                    ? { x: width - p.x, y: p.y }
                    : { x: p.x, y: height - p.y }
            );

            return { ...zone, points: flipped };
        }

        // Hình cơ bản: lật bằng scale âm.
        return {
            ...zone,
            flipX:
                axis === "horizontal"
                    ? !zone.flipX
                    : zone.flipX,
            flipY:
                axis === "vertical"
                    ? !zone.flipY
                    : zone.flipY,
        };
    });
}
