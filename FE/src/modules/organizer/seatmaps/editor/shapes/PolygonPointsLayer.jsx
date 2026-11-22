import { memo } from "react";
import { Circle } from "react-konva";

function PolygonPointsLayer({ points = [], onPointChange }) {
    if (!Array.isArray(points) || points.length < 3) return null;

    return (
        <>
            {points.map((point, index) => {
                const px = Array.isArray(point)
                    ? Number(point[0]) || 0
                    : Number(point?.x) || 0;
                const py = Array.isArray(point)
                    ? Number(point[1]) || 0
                    : Number(point?.y) || 0;

                return (
                    <Circle
                        key={index}
                        x={px}
                        y={py}
                        radius={5}
                        fill="#F59E0B"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        shadowColor="#000000"
                        shadowBlur={3}
                        shadowOpacity={0.25}
                        hitStrokeWidth={14}
                        cursor="move"
                        onPointerDown={(event) => {
                            event.cancelBubble = true;

                            onPointChange?.(event, index);
                        }}
                    />
                );
            })}
        </>
    );
}

export default memo(PolygonPointsLayer);