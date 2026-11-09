import { memo } from "react";
import { Circle } from "react-konva";

/**
 * Tay nắm chỉnh đỉnh đa giác (chữ T/U/L...).
 *
 * Chỉ hiển thị khi zone đang được chọn và có hình POLYGON.
 */
function PolygonPointsLayer({ points = [], onPointChange }) {
    if (!Array.isArray(points) || points.length < 3) return null;

    return (
        <>
            {points.map((point, index) => (
                <Circle
                    key={index}
                    x={Number(point?.x) || 0}
                    y={Number(point?.y) || 0}
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
            ))}
        </>
    );
}

export default memo(PolygonPointsLayer);
