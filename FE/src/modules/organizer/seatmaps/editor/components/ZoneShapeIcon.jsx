import { memo } from "react";

import { buildShape } from "../../../../../utils/canvas/shapeGeometry";

function ZoneShapeIcon({
    shape = "RECTANGLE",
    color = "#3b82f6",
    size = 18,
    className = "",
}) {
    const data = buildShape({
        shape,
        width: size,
        height: size,
    });

    const common = {
        fill: color,
        stroke: "rgba(255,255,255,0.9)",
        strokeWidth: 1.5,
    };

    if (data.tag === "rect") {
        return (
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className={`shrink-0 ${className}`}
                aria-hidden="true"
            >
                <rect
                    x={data.x}
                    y={data.y}
                    width={data.width}
                    height={data.height}
                    rx={data.rx}
                    ry={data.ry}
                    {...common}
                />
            </svg>
        );
    }

    if (data.tag === "ellipse") {
        return (
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className={`shrink-0 ${className}`}
                aria-hidden="true"
            >
                <ellipse
                    cx={data.cx}
                    cy={data.cy}
                    rx={data.rx}
                    ry={data.ry}
                    {...common}
                />
            </svg>
        );
    }

    const points = (data.points || [])
        .map(([x, y]) => `${x},${y}`)
        .join(" ");

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={`shrink-0 ${className}`}
            aria-hidden="true"
        >
            <polygon points={points} {...common} />
        </svg>
    );
}

export default memo(ZoneShapeIcon);
