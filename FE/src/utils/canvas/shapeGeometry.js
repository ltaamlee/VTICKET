/**
 * ============================================================
 * HÌNH HỌC KHU VỰC (SHAPE GEOMETRY)
 * ============================================================
 *
 * Logic thuần tuý (không phụ thuộc React / Konva) dùng chung cho:
 *  - Canvas editor (React Konva)
 *  - Seat map preview (SVG)
 *  - Panel thuộc tính (icon hình dạng)
 *
 * Toạ độ luôn nằm trong hộp zone: x từ 0..width, y từ 0..height.
 */

export const ZONE_SHAPES = [
    { value: "RECTANGLE", label: "Chữ nhật" },
    { value: "ROUNDED", label: "Chữ nhật bo góc" },
    { value: "CIRCLE", label: "Tròn" },
    { value: "ELLIPSE", label: "Bầu dục" },
    { value: "TRIANGLE", label: "Tam giác" },
    { value: "DIAMOND", label: "Thoi" },
    { value: "TRAPEZOID", label: "Thang" },
    { value: "POLYGON", label: "Đa giác tự do" },
];

export const POLYGON_PRESETS = [
    {
        value: "HEXAGON",
        label: "Lục giác",
        points: [
            [0.5, 0],
            [1, 0.25],
            [1, 0.75],
            [0.5, 1],
            [0, 0.75],
            [0, 0.25],
        ],
    },
    {
        value: "LETTER_T",
        label: "Chữ T",
        points: [
            [0, 0],
            [1, 0],
            [1, 0.3],
            [0.62, 0.3],
            [0.62, 1],
            [0.38, 1],
            [0.38, 0.3],
            [0, 0.3],
        ],
    },
    {
        value: "LETTER_U",
        label: "Chữ U",
        points: [
            [0, 0],
            [0.32, 0],
            [0.32, 0.68],
            [0.68, 0.68],
            [0.68, 0],
            [1, 0],
            [1, 1],
            [0, 1],
        ],
    },
    {
        value: "LETTER_L",
        label: "Chữ L",
        points: [
            [0, 0],
            [0.32, 0],
            [0.32, 0.68],
            [1, 0.68],
            [1, 1],
            [0, 1],
        ],
    },
];

export function buildPresetPoints(preset, width, height) {
    const template = POLYGON_PRESETS.find(
        (item) => item.value === preset
    );

    const w = Math.max(Number(width) || 0, 1);
    const h = Math.max(Number(height) || 0, 1);

    if (!template) {
        return POLYGON_PRESETS[0].points.map(([x, y]) => ({
            x: x * w,
            y: y * h,
        }));
    }

    return template.points.map(([x, y]) => ({
        x: x * w,
        y: y * h,
    }));
}

/**
 * Chuẩn hoá danh sách lỗ (holes) về dạng mảng toạ độ [x, y].
 */
function normalizeHoles(holes) {
    if (!Array.isArray(holes)) return [];

    return holes
        .map((hole) => (Array.isArray(hole) ? hole : hole?.points))
        .filter((hole) => Array.isArray(hole) && hole.length >= 3)
        .map((hole) =>
            // hole có thể là mảng [x, y] hoặc mảng { x, y }
            hole.map((point) =>
                Array.isArray(point)
                    ? [Number(point[0]), Number(point[1])]
                    : [
                          Number(point?.x) || 0,
                          Number(point?.y) || 0,
                      ]
            )
        );
}

/**
 * Dựng dữ liệu hình của một zone.
 *
 * @returns {{tag:'rect'|'ellipse'|'polygon', holes:Array<Array<[number,number]>>}}
 */
export function buildShape({
    shape,
    width,
    height,
    points,
    holes = [],
}) {
    const w = Math.max(Number(width) || 0, 1);
    const h = Math.max(Number(height) || 0, 1);

    const holeList = normalizeHoles(holes);

    switch (shape) {
        case "ROUNDED":
            return {
                tag: "rect",
                x: 0,
                y: 0,
                width: w,
                height: h,
                rx: Math.min(w, h) * 0.15,
                ry: Math.min(w, h) * 0.15,
                holes: holeList,
            };

        case "CIRCLE": {
            const r = Math.min(w, h) / 2;

            return {
                tag: "ellipse",
                cx: w / 2,
                cy: h / 2,
                rx: r,
                ry: r,
                holes: holeList,
            };
        }

        case "ELLIPSE":
            return {
                tag: "ellipse",
                cx: w / 2,
                cy: h / 2,
                rx: w / 2,
                ry: h / 2,
                holes: holeList,
            };

        case "TRIANGLE":
            return {
                tag: "polygon",
                points: [
                    [w / 2, 0],
                    [w, h],
                    [0, h],
                ],
                holes: holeList,
            };

        case "DIAMOND":
            return {
                tag: "polygon",
                points: [
                    [w / 2, 0],
                    [w, h / 2],
                    [w / 2, h],
                    [0, h / 2],
                ],
                holes: holeList,
            };

        case "TRAPEZOID":
            return {
                tag: "polygon",
                points: [
                    [w * 0.18, 0],
                    [w * 0.82, 0],
                    [w, h],
                    [0, h],
                ],
                holes: holeList,
            };

        case "POLYGON":
        case "HEXAGON":
        case "LETTER_T":
        case "LETTER_U":
        case "LETTER_L":
        case "CUSTOM": {
            const custom = Array.isArray(points)
                ? points
                      .map((p) => {
                          if (Array.isArray(p)) {
                              return [Number(p[0]), Number(p[1])];
                          }
                          return [Number(p?.x), Number(p?.y)];
                      })
                      .filter(
                          ([x, y]) =>
                              Number.isFinite(x) && Number.isFinite(y)
                      )
                : [];

            if (custom.length >= 3) {
                return {
                    tag: "polygon",
                    points: custom,
                    holes: holeList,
                };
            }

            const cx = w / 2;
            const cy = h / 2;
            const rx = w / 2;
            const ry = h / 2;

            return {
                tag: "polygon",
                points: Array.from({ length: 6 }, (_, i) => {
                    const angle =
                        (Math.PI / 3) * i - Math.PI / 2;

                    return [
                        cx + rx * Math.cos(angle),
                        cy + ry * Math.sin(angle),
                    ];
                }),
                holes: holeList,
            };
        }

        case "RECTANGLE":
        default:
            return {
                tag: "rect",
                x: 0,
                y: 0,
                width: w,
                height: h,
                holes: holeList,
            };
    }
}

export function toPointsString(points) {
    return points
        .map(([x, y]) => `${x},${y}`)
        .join(" ");
}
