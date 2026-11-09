import { memo } from "react";
import { Circle, Layer, Rect } from "react-konva";

/**
 * Lớp tay nắm cho CẢ NHÓM khu vực.
 *
 * Khi các khu vực được gom nhóm, mỗi thành viên không hiển thị tay
 * nắm riêng. Thay vào đó, khung bao của nhóm có tay nắm xoay + 4 tay
 * nắm dãn, kéo được thì áp dụng lên toàn bộ thành viên.
 */
function GroupTransformer({
    bounds = null,
    onResizeStart,
    onRotateStart,
}) {
    if (!bounds) return null;

    const cornerHandles = [
        { id: "nw", x: bounds.x, y: bounds.y },
        {
            id: "ne",
            x: bounds.x + bounds.width,
            y: bounds.y,
        },
        {
            id: "sw",
            x: bounds.x,
            y: bounds.y + bounds.height,
        },
        {
            id: "se",
            x: bounds.x + bounds.width,
            y: bounds.y + bounds.height,
        },
    ];

    return (
        <Layer>
            <Rect
                x={bounds.x}
                y={bounds.y}
                width={bounds.width}
                height={bounds.height}
                stroke="#A855F7"
                strokeWidth={2}
                dash={[8, 6]}
                listening={false}
            />

            {/* Tay nắm xoay nhóm */}
            <Circle
                x={bounds.x + bounds.width / 2}
                y={bounds.y - 28}
                radius={6}
                fill="#9333EA"
                stroke="#FFFFFF"
                strokeWidth={2}
                shadowColor="#000000"
                shadowBlur={3}
                shadowOpacity={0.25}
                hitStrokeWidth={16}
                cursor="grab"
                onPointerDown={(event) => {
                    event.cancelBubble = true;

                    onRotateStart?.(event);
                }}
            />

            {/* Tay nắm dãn nhóm (4 góc) */}
            {cornerHandles.map((handle) => (
                <Circle
                    key={handle.id}
                    x={handle.x}
                    y={handle.y}
                    radius={5}
                    fill="#9333EA"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    shadowColor="#000000"
                    shadowBlur={3}
                    shadowOpacity={0.25}
                    hitStrokeWidth={16}
                    cursor="nwse-resize"
                    onPointerDown={(event) => {
                        event.cancelBubble = true;

                        onResizeStart?.(event, handle.id);
                    }}
                />
            ))}
        </Layer>
    );
}

export default memo(GroupTransformer);
