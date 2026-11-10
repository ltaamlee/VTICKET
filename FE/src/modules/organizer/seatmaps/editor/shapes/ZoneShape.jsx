import { memo, useMemo } from "react";
import { Path, Rect, Ellipse } from "react-konva";

import { buildShape, } from "../../../../../utils/canvas/shapeGeometry";
import {
    buildZonePath,
    zoneHasHoles,
} from "../../../../../utils/canvas/shapePath";

function ZoneShape({
    shape = "RECTANGLE",
    width = 120,
    height = 60,
    points = null,
    holes = null,
    color = "#3b82f6",
    stroke = "rgba(255,255,255,0.85)",
    strokeWidth = 2,
    opacity = 1,
    fillRule,
    listening = true,
    onPointerDown,
    onClick,
    name,
    x = 0,
    y = 0,
}) {
    const w = Math.max(Number(width) || 0, 1);
    const h = Math.max(Number(height) || 0, 1);

    const data = useMemo(
        () =>
            buildShape({
                shape,
                width: w,
                height: h,
                points,
                holes,
            }),
        [shape, w, h, points, holes]
    );

    const path = useMemo(
        () =>
            buildZonePath({
                shape,
                width: w,
                height: h,
                points,
                holes,
            }),
        [shape, w, h, points, holes]
    );

    const common = {
        fill: color,
        stroke,
        strokeWidth,
        opacity,
        listening,
        name,
        onPointerDown,
        onClick,
    };

    if (data.tag === "rect") {
        return (
            <Rect
                {...common}
                x={data.x + x}
                y={data.y + y}
                width={data.width}
                height={data.height}
                cornerRadius={
                    data.rx
                        ? [data.rx, data.rx, data.rx, data.rx]
                        : undefined
                }
            />
        );
    }

    if (data.tag === "ellipse") {
        return (
            <Ellipse
                {...common}
                x={data.cx + x}
                y={data.cy + y}
                radiusX={data.rx}
                radiusY={data.ry}
            />
        );
    }

    if (!path) return null;

    return (
        <Path
            {...common}
            data={path}
            x={x}
            y={y}
            fillRule={
                fillRule ??
                (zoneHasHoles({ holes }) ? "evenodd" : undefined)
            }
        />
    );
}

export default memo(ZoneShape);
