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

export const DEFAULT_SHAPE = "RECTANGLE";

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

export function isValidShape(shape) {
    return ZONE_SHAPES.some((item) => item.value === shape);
}

export function buildShape({
    shape,
    width,
    height,
    points,
    holes = [],
}) {
    const w = Math.max(Number(width) || 0, 1);
    const h = Math.max(Number(height) || 0, 1);

    const holeList = Array.isArray(holes)
        ? holes
              .map((hole) =>
                  Array.isArray(hole)
                      ? hole
                      : hole?.points
              )
              .filter(
                  (hole) =>
                      Array.isArray(hole) && hole.length >= 3
              )
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
              )
        : [];

    const holeProps = holeList.map((hole) => ({
        d: `M ${hole
            .map(([x, y]) => `${x} ${y}`)
            .join(" L ")} Z`,
        points: hole,
    }));

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
                holes: holeProps,
            };

        case "CIRCLE": {
            const r = Math.min(w, h) / 2;

            return {
                tag: "ellipse",
                cx: w / 2,
                cy: h / 2,
                rx: r,
                ry: r,
                holes: holeProps,
            };
        }

        case "ELLIPSE":
            return {
                tag: "ellipse",
                cx: w / 2,
                cy: h / 2,
                rx: w / 2,
                ry: h / 2,
                holes: holeProps,
            };

        case "TRIANGLE":
            return {
                tag: "polygon",
                points: [
                    [w / 2, 0],
                    [w, h],
                    [0, h],
                ],
                holes: holeProps,
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
                holes: holeProps,
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
                holes: holeProps,
            };

        case "POLYGON":
        case "HEXAGON":
        case "LETTER_T":
        case "LETTER_U":
        case "LETTER_L":
        case "CUSTOM": {
            const custom = Array.isArray(points)
                ? points
                      .map((p) => [Number(p?.x), Number(p?.y)])
                      .filter(
                          ([x, y]) =>
                              Number.isFinite(x) && Number.isFinite(y)
                      )
                : [];

            if (custom.length >= 3) {
                return {
                    tag: "polygon",
                    points: custom,
                    holes: holeProps,
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
                holes: holeProps,
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
                holes: holeProps,
            };
    }
}

export function toPointsString(points) {
    return points
        .map(([x, y]) => `${x},${y}`)
        .join(" ");
}

export function buildShapePath(data, offset = {}) {
    const ox = Number(offset.x) || 0;
    const oy = Number(offset.y) || 0;

    const parts = [];

    if (data.tag === "rect") {
        const rx = data.rx || 0;

        parts.push(
            `M ${data.x + rx + ox} ${data.y + oy} ` +
                `H ${data.x + data.width - rx + ox} ` +
                `A ${rx} ${rx} 0 0 1 ${data.x + data.width + ox} ${data.y + rx + oy} ` +
                `V ${data.y + data.height - rx + oy} ` +
                `A ${rx} ${rx} 0 0 1 ${data.x + data.width - rx + ox} ${data.y + data.height + oy} ` +
                `H ${data.x + rx + ox} ` +
                `A ${rx} ${rx} 0 0 1 ${data.x + ox} ${data.y + data.height - rx + oy} ` +
                `V ${data.y + rx + oy} ` +
                `A ${rx} ${rx} 0 0 1 ${data.x + rx + ox} ${data.y + oy} Z`
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

    (data.holes || []).forEach((hole) => {
        const pts = hole.points || [];

        if (pts.length < 3) return;

        parts.push(
            `M ${pts
                .map(([x, y]) => `${x + ox} ${y + oy}`)
                .join(" L ")} Z`
        );
    });

    return parts.join(" ");
}

export function ZoneShape({
    shape = "RECTANGLE",
    width = 120,
    height = 60,
    points = null,
    holes = [],
    color = "#3b82f6",
    stroke = "rgba(255,255,255,0.85)",
    strokeWidth = 2,
    className = "",
    title,
}) {
    const data = buildShape({
        shape,
        width,
        height,
        points,
        holes,
    });

    const common = { fill: color, stroke, strokeWidth };

    if (data.holes?.length) {
        return (
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className={className}
                role={title ? "img" : undefined}
                aria-label={title}
            >
                <path
                    d={buildShapePath(data)}
                    fillRule="evenodd"
                    {...common}
                />
            </svg>
        );
    }

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className={className}
            role={title ? "img" : undefined}
            aria-label={title}
        >
            {data.tag === "rect" && (
                <rect
                    x={data.x}
                    y={data.y}
                    width={data.width}
                    height={data.height}
                    rx={data.rx}
                    ry={data.ry}
                    {...common}
                />
            )}

            {data.tag === "ellipse" && (
                <ellipse
                    cx={data.cx}
                    cy={data.cy}
                    rx={data.rx}
                    ry={data.ry}
                    {...common}
                />
            )}

            {data.tag === "polygon" && (
                <polygon
                    points={toPointsString(data.points)}
                    {...common}
                />
            )}
        </svg>
    );
}

export function ZoneShapeIcon({
    shape = "RECTANGLE",
    color = "#3b82f6",
    size = 18,
    className = "",
}) {
    return (
        <ZoneShape
            shape={shape}
            width={size}
            height={size}
            color={color}
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={1.5}
            className={`shrink-0 ${className}`}
        />
    );
}
