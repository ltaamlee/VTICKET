import { memo } from "react";
import { Layer, Rect } from "react-konva";

/**
 * Vùng kéo chọn (marquee) - vẽ bằng Konva thay vì div.
 */
function MarqueeLayer({ rect = null }) {
    if (!rect) return null;

    const x = Math.min(rect.startX, rect.x);
    const y = Math.min(rect.startY, rect.y);

    const width = Math.abs(rect.x - rect.startX);
    const height = Math.abs(rect.y - rect.startY);

    return (
        <Layer listening={false}>
            <Rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="rgba(59,130,246,0.10)"
                stroke="#3B82F6"
                strokeWidth={1}
                listening={false}
            />
        </Layer>
    );
}

export default memo(MarqueeLayer);
