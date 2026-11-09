import polygonClipping from "polygon-clipping";

/**
 * BOOLEAN OPERATIONS - GỘP / TRỪ / GIAO / LOẠI TRỪ
 * Thư viện: polygon-clipping (Martinez-Rueda boolean ops).
 */

function zoneToPolygon(zone) {
    const width = Math.max(Number(zone?.width) || 0, 0.01);
    const height = Math.max(Number(zone?.height) || 0, 0.01);
    const posX = Number(zone?.posX) || 0;
    const posY = Number(zone?.posY) || 0;

    const shape = zone?.shape || "RECTANGLE";

    const flipX = zone?.flipX === true;
    const flipY = zone?.flipY === true;
    const rotation = Number(zone?.rotation) || 0;

    /**
     * Chuyển toạ độ cục bộ (trong hộp zone) sang toạ độ canvas.
     * Thứ tự biến đổi phải KHỚP với CSS transform trong CanvasZone:
     *   transform: rotate(θ) scaleX(±1) scaleY(±1)
     *   -> áp dụng scale trước, sau đó mới rotate (về quanh tâm zone).
     */
    const toCanvas = (local) => {
        let [x, y] = local;

        // 1) Lật gương quanh tâm hộp zone.
        if (flipX) x = width - x;
        if (flipY) y = height - y;

        // 2) Xoay quanh tâm hộp zone (CSS rotate, trục y hướng xuống).
        if (rotation) {
            const rad = (rotation * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const cx = width / 2;
            const cy = height / 2;
            const dx = x - cx;
            const dy = y - cy;

            x = cx + dx * cos - dy * sin;
            y = cy + dx * sin + dy * cos;
        }

        return [round(x + posX), round(y + posY)];
    };

    const shape_ = shape;

    if (
        shape_ === "POLYGON" ||
        shape_ === "CUSTOM" ||
        shape_ === "HEXAGON" ||
        shape_ === "LETTER_T" ||
        shape_ === "LETTER_U" ||
        shape_ === "LETTER_L"
    ) {
        const points = Array.isArray(zone?.points)
            ? zone.points
                  .map((p) => [Number(p?.x), Number(p?.y)])
                  .filter(
                      ([x, y]) =>
                          Number.isFinite(x) && Number.isFinite(y)
                  )
            : [];

        if (points.length >= 3) {
            const outer = points.map(toCanvas);

            // Các lỗ (hình rỗng) của đa giác cũng phải được tính cùng
            // phép biến đổi, nếu không sẽ bị lệch khi gộp.
            const holes = Array.isArray(zone?.holes)
                ? zone.holes
                      .filter(
                          (hole) =>
                              Array.isArray(hole) && hole.length >= 3
                      )
                      .map((hole) =>
                          hole.map((p) =>
                              toCanvas([
                                  Number(p?.x) || 0,
                                  Number(p?.y) || 0,
                              ])
                          )
                      )
                : [];

            // polygon-clipping: mỗi polygon = [vòng ngoài, ...lỗ]
            return [outer, ...holes];
        }
    }

    switch (shape_) {
        case "ROUNDED": {
            const r = Math.min(width, height) * 0.15;

            return [
                roundedRectPolygon(width, height, r).map(toCanvas),
            ];
        }

        case "CIRCLE": {
            const r = Math.min(width, height) / 2;

            return [
                ellipsePolygon(
                    width / 2,
                    height / 2,
                    r,
                    r
                ).map(toCanvas),
            ];
        }

        case "ELLIPSE":
            return [
                ellipsePolygon(
                    width / 2,
                    height / 2,
                    width / 2,
                    height / 2
                ).map(toCanvas),
            ];

        case "TRIANGLE":
            return [
                [
                    [width / 2, 0],
                    [width, height],
                    [0, height],
                ].map(toCanvas),
            ];

        case "DIAMOND":
            return [
                [
                    [width / 2, 0],
                    [width, height / 2],
                    [width / 2, height],
                    [0, height / 2],
                ].map(toCanvas),
            ];

        case "TRAPEZOID":
            return [
                [
                    [width * 0.18, 0],
                    [width * 0.82, 0],
                    [width, height],
                    [0, height],
                ].map(toCanvas),
            ];

        case "RECTANGLE":
        default:
            return [
                [
                    [0, 0],
                    [width, 0],
                    [width, height],
                    [0, height],
                ].map(toCanvas),
            ];
    }
}

function round(value) {
    return Math.round(value * 1000) / 1000;
}

/**
 * Tạo đa giác xấp xỉ hình ellipse.
 * @param {number} cx Tâm X (trong hộp zone)
 * @param {number} cy Tâm Y (trong hộp zone)
 * @param {number} rx Bán trục ngang
 * @param {number} ry Bán trục dọc
 * @param {number} steps Số đỉnh
 */
function ellipsePolygon(cx, cy, rx, ry, steps = 64) {
    const points = [];

    for (let i = 0; i < steps; i += 1) {
        const angle = (Math.PI * 2 * i) / steps - Math.PI / 2;

        points.push([
            cx + rx * Math.cos(angle),
            cy + ry * Math.sin(angle),
        ]);
    }

    return points;
}

function roundedRectPolygon(width, height, radius, steps = 8) {
    const r = Math.min(radius, width / 2, height / 2);

    const points = [];

    const corners = [
        { cx: width - r, cy: r, start: -Math.PI / 2 },
        { cx: width - r, cy: height - r, start: 0 },
        { cx: r, cy: height - r, start: Math.PI / 2 },
        { cx: r, cy: r, start: Math.PI },
    ];

    corners.forEach(({ cx, cy, start }) => {
        for (let i = 0; i <= steps; i += 1) {
            const angle = start + (Math.PI / 2) * (i / steps);

            points.push([
                cx + r * Math.cos(angle),
                cy + r * Math.sin(angle),
            ]);
        }
    });

    return points;
}

function applyBooleanOperation(zones, operation) {
    const valid = (zones || []).filter(
        (zone) => zoneToPolygon(zone)[0]?.length >= 3
    );

    if (valid.length < 2) {
        return {
            ok: false,
            reason: "Cần ít nhất 2 khu vực để gộp hình.",
        };
    }

    const geometries = valid.map((zone) => zoneToPolygon(zone));

    try {
        let result;

        switch (operation) {
            case "UNION":
                result = polygonClipping.union(
                    geometries[0],
                    ...geometries.slice(1)
                );
                break;

            case "DIFFERENCE":
                result = polygonClipping.difference(
                    geometries[0],
                    ...geometries.slice(1)
                );
                break;

            case "INTERSECT":
                result = polygonClipping.intersection(
                    geometries[0],
                    ...geometries.slice(1)
                );
                break;

            case "EXCLUDE":
                result = polygonClipping.xor(
                    geometries[0],
                    ...geometries.slice(1)
                );
                break;

            default:
                return {
                    ok: false,
                    reason: "Phép toán không hợp lệ.",
                };
        }

        if (!result || result.length === 0) {
            return {
                ok: false,
                reason:
                    operation === "INTERSECT"
                        ? "Các khu vực không có phần chung."
                        : "Không tạo được hình mới.",
            };
        }

        return { ok: true, polygons: result };
    } catch {
        return {
            ok: false,
            reason: "Không thể gộp các hình này.",
        };
    }
}

function polygonsToZones(polygons, template) {
    const zones = [];

    polygons.forEach((polygon) => {
        if (!polygon || polygon.length === 0) return;

        const rings = polygon;

        // Vòng ngoài cùng là hình chính.
        const outer = rings[0];

        if (!outer || outer.length < 3) return;

            const xs = outer.map((p) => p[0]);
            const ys = outer.map((p) => p[1]);

            const minX = Math.min(...xs);
            const minY = Math.min(...ys);
            const maxX = Math.max(...xs);
            const maxY = Math.max(...ys);

            const width = Math.max(maxX - minX, 1);
            const height = Math.max(maxY - minY, 1);

            const points = outer.map(([x, y]) => ({
                x: round(x - minX),
                y: round(y - minY),
            }));

            const holes = rings.slice(1).map((ring) =>
                ring.map(([x, y]) => ({
                    x: round(x - minX),
                    y: round(y - minY),
                }))
            );

            zones.push({
                ...template,
                name:
                    zones.length > 0
                        ? `${template?.name || "Khu vực"} ${
                              zones.length + 1
                          }`
                        : template?.name || "Khu vực",
                shape: "POLYGON",
                posX: round(minX),
                posY: round(minY),
                width: round(width),
                height: round(height),
                points,
                holes,
                rotation: 0,
                flipX: false,
                flipY: false,
                zIndex:
                    (Number(template?.zIndex) || 0) +
                    zones.length * 0.001,
                groupId: null,
            });
    });

    return zones;
}

function splitZoneWithHoles(zone) {
    if (!zone || zone.shape !== "POLYGON") return [];

    const holes = Array.isArray(zone.holes) ? zone.holes : [];

    if (holes.length === 0) {
        return [
            {
                ...zone,
                id: undefined,
                name: `${zone.name} (tách)`,
            },
        ];
    }

    return holes.map((hole, index) => {
        const xs = hole.map((p) => p.x);
        const ys = hole.map((p) => p.y);

        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        return {
            ...zone,
            id: undefined,
            name: `${zone.name} (lỗ ${index + 1})`,
            shape: "POLYGON",
            posX: round(zone.posX + minX),
            posY: round(zone.posY + minY),
            width: round(Math.max(maxX - minX, 1)),
            height: round(Math.max(maxY - minY, 1)),
            points: hole.map((p) => ({
                x: round(p.x - minX),
                y: round(p.y - minY),
            })),
            holes: [],
            groupId: null,
        };
    });
}

export function combineZones(zones, selectedIds, operation) {
    const idSet = new Set(selectedIds || []);

    const selected = (zones || []).filter((zone) =>
        idSet.has(zone.id)
    );

    if (selected.length < 2) {
        return {
            ok: false,
            reason: "Cần chọn ít nhất 2 khu vực để gộp hình.",
        };
    }

    const result = applyBooleanOperation(selected, operation);

    if (!result.ok) {
        return result;
    }

    const base = selected[0];

    const originParts = selected.map((zone) => ({
        name: zone.name || "",
        code: zone.code || "",
        color: zone.color || "#3b82f6",
        type: zone.type || "STANDING",
        shape: zone.shape || "RECTANGLE",
        price: Number(zone.price) || 0,
        rowCount: Number(zone.rowCount) || 0,
        seatPerRow: Number(zone.seatPerRow) || 0,
        capacity: Number(zone.capacity) || 0,
        posX: Number(zone.posX) || 0,
        posY: Number(zone.posY) || 0,
        width: Number(zone.width) || 120,
        height: Number(zone.height) || 60,
        rotation: Number(zone.rotation) || 0,
        level: Number(zone.level) || 1,
        points: zone.points || null,
        holes: zone.holes || null,
        flipX: zone.flipX === true,
        flipY: zone.flipY === true,
    }));

    // Mã nhóm cho lần gộp này - dùng để liên kết các mảnh sinh ra
    // (trường hợp Union tạo ra nhiều vùng rời rạc).
    const combineGroupId = `cmb-${Date.now()}`;

    const newZones = polygonsToZones(result.polygons, {
        ...base,
        groupId: null,
    }).map((zone, index) => ({
        ...zone,
        id: undefined,
        // Các mảnh của cùng 1 lần gộp dùng chung combineGroupId.
        // originParts chỉ lưu ở mảnh ĐẦU TIÊN để "Tách khối" bung
        // đúng 1 lần (nếu lưu ở mọi mảnh sẽ bị nhân đôi).
        combineGroupId,
        originParts: index === 0 ? originParts : null,
        // Khối gộp không giữ ghế cũ (vị trí ghế đã không còn khớp
        // với hình mới) - số ghế được tính lại từ sức chứa.
        seats: [],
        rowCount: 0,
        seatPerRow: 0,
        type:
            base.type === "STAGE"
                ? "STAGE"
                : base.type === "SEATED"
                  ? "STANDING"
                  : base.type,
        capacity:
            base.type === "STAGE"
                ? 0
                : Math.max(
                      Number(base.capacity) || 0,
                      selected.reduce(
                          (sum, item) =>
                              sum +
                              (item.type === "SEATED"
                                  ? (Number(item.rowCount) || 0) *
                                    (Number(item.seatPerRow) || 0)
                                  : Number(item.capacity) || 0),
                          0
                      )
                  ),
    }));

    if (newZones.length === 0) {
        return {
            ok: false,
            reason: "Không tạo được khối mới từ các hình đã chọn.",
        };
    }

    const firstIndex = zones.findIndex((zone) => idSet.has(zone.id));

    const rest = zones.filter((zone) => !idSet.has(zone.id));

    const maxZ = zones.reduce(
        (max, zone) => Math.max(max, Number(zone.zIndex) || 0),
        0
    );

    const inserted = newZones.map((zone, index) => ({
        ...zone,
        zIndex: maxZ + 1 + index,
    }));

    const next = [...rest];

    next.splice(Math.max(firstIndex, 0), 0, ...inserted);

    return { ok: true, zones: next, newZoneIds: null };
}

export function splitZones(zones, selectedIds) {
    const idSet = new Set(selectedIds || []);

    const selected = (zones || []).filter((zone) =>
        idSet.has(zone.id)
    );

    if (selected.length === 0) {
        return { ok: false, reason: "Chưa chọn khu vực nào." };
    }

    const hasOrigin = selected.some(
        (zone) => Array.isArray(zone.originParts) && zone.originParts.length > 0
    );

    if (!hasOrigin) {
        const hasHoles = selected.some(
            (zone) => Array.isArray(zone.holes) && zone.holes.length > 0
        );

        if (!hasHoles) {
            return {
                ok: false,
                reason: "Khu vực này không thể tách thêm.",
            };
        }

        const firstIndex = zones.findIndex((zone) => idSet.has(zone.id));

        const rest = zones.filter((zone) => !idSet.has(zone.id));

        const expanded = [];

        selected.forEach((zone) => {
            const parts = splitZoneWithHoles(zone);

            if (parts.length === 0) {
                expanded.push(zone);
            } else {
                expanded.push(...parts);
            }
        });

        const next = [...rest];

        next.splice(Math.max(firstIndex, 0), 0, ...expanded);

        return { ok: true, zones: next };
    }

    // Khôi phục các zone gốc.
    // Chỉ bung 1 lần: nếu lần gộp tạo ra nhiều mảnh rời rạc, chỉ
    // mảnh đầu tiên giữ originParts -> các mảnh còn lại sẽ bị xoá
    // cùng lúc (tránh nhân đôi số lượng khu vực).
    const firstIndex = zones.findIndex((zone) => idSet.has(zone.id));

    // Tập id của tất cả mảnh thuộc cùng lần gộp.
    const combineGroupIds = new Set(
        selected
            .map((zone) => zone.combineGroupId)
            .filter(Boolean)
    );

    const removedIds = new Set(idSet);

    zones.forEach((zone) => {
        if (
            zone.combineGroupId &&
            combineGroupIds.has(zone.combineGroupId)
        ) {
            removedIds.add(zone.id);
        }
    });

    const rest = zones.filter((zone) => !removedIds.has(zone.id));

    const expanded = [];

    selected.forEach((zone) => {
        if (Array.isArray(zone.originParts) && zone.originParts.length > 0) {
            expanded.push(
                ...zone.originParts.map((part) => ({
                    ...part,
                    id: undefined,
                    groupId: null,
                    originParts: null,
                    combineGroupId: null,
                }))
            );
        }
    });

    // Các mảnh không có originParts (mảnh phụ) chỉ bị xoá, không bung.
    if (expanded.length === 0) {
        selected.forEach((zone) => {
            if (
                !Array.isArray(zone.originParts) ||
                zone.originParts.length === 0
            ) {
                expanded.push(zone);
            }
        });
    }

    const maxZ = zones.reduce(
        (max, zone) => Math.max(max, Number(zone.zIndex) || 0),
        0
    );

    const inserted = expanded.map((zone, index) => ({
        ...zone,
        zIndex: maxZ + 1 + index,
    }));

    const next = [...rest];

    next.splice(Math.max(firstIndex, 0), 0, ...inserted);

    return { ok: true, zones: next };
}