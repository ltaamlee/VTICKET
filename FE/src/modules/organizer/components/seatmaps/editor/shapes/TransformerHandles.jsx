import { memo } from "react";
import { Circle, Rect } from "react-konva";

import { getResizeCursor } from "../../../../../../utils/canvas/resizeCursor";

/**
 * Tay nắm dãn ở 4 góc + 4 cạnh + tay nắm xoay.
 *
 * - Góc: hình tròn đậm (kéo theo 2 trục).
 * - Cạnh: hình tròn nhạt (kéo theo 1 trục).
 * - Xoay: nằm trên đỉnh khối.
 */
function TransformerLayer({
    width = 120,
    height = 60,
    rotation = 0,
    showRotate = true,
    showHandles = true,
    onResizeStart,
    onRotateStart,
}) {
    if (!showHandles) return null;

    const w = Math.max(Number(width) || 0, 1);
    const h = Math.max(Number(height) || 0, 1);

    // 4 tay nắm ở góc.
    const cornerHandles = [
        { id: "nw", x: 0, y: 0 },
        { id: "ne", x: w, y: 0 },
        { id: "sw", x: 0, y: h },
        { id: "se", x: w, y: h },
    ];

    // 4 tay nắm ở giữa cạnh (giống Figma).
    const edgeHandles = [
        { id: "n", x: w / 2, y: 0 },
        { id: "s", x: w / 2, y: h },
        { id: "w", x: 0, y: h / 2 },
        { id: "e", x: w, y: h / 2 },
    ];

    const startResize = (event, handle) => {
        event.cancelBubble = true;

        onResizeStart?.(event, handle);
    };

    return (
        <>
            {cornerHandles.map((handle) => (
                <Circle
                    key={handle.id}
                    x={handle.x}
                    y={handle.y}
                    radius={5}
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    shadowColor="#000000"
                    shadowBlur={3}
                    shadowOpacity={0.25}
                    hitStrokeWidth={14}
                    cursor={getResizeCursor(handle.id, rotation)}
                    onPointerDown={(event) =>
                        startResize(event, handle.id)
                    }
                />
            ))}

            {edgeHandles.map((handle) => (
                <Circle
                    key={handle.id}
                    x={handle.x}
                    y={handle.y}
                    radius={4}
                    fill="#3B82F6"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    shadowColor="#000000"
                    shadowBlur={3}
                    shadowOpacity={0.2}
                    hitStrokeWidth={14}
                    cursor={getResizeCursor(handle.id, rotation)}
                    onPointerDown={(event) =>
                        startResize(event, handle.id)
                    }
                />
            ))}

            {showRotate && (
                <Rect
                    x={w / 2 - 5}
                    y={-26}
                    width={10}
                    height={10}
                    cornerRadius={5}
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    shadowColor="#000000"
                    shadowBlur={3}
                    shadowOpacity={0.25}
                    hitStrokeWidth={14}
                    cursor="grab"
                    onPointerDown={(event) => {
                        event.cancelBubble = true;

                        onRotateStart?.(event);
                    }}
                />
            )}
        </>
    );
}

export default memo(TransformerLayer);
