import { memo } from "react";
import { Layer, Rect } from "react-konva";

/**
 * Lớp nền: hình chữ nhật trắng đại diện cho vùng sơ đồ.
 *
 * Không lắng nghe sự kiện (listening=false) để không chặn thao tác.
 */
function Background({
    width,
    height,
    backgroundColor = "#FFFFFF",
    borderColor = "#D1D5DB",
}) {
    return (
        <Layer listening={false}>
            <Rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill={backgroundColor}
                stroke={borderColor}
                strokeWidth={1}
                shadowColor="#000000"
                shadowBlur={8}
                shadowOpacity={0.06}
            />
        </Layer>
    );
}

export default memo(Background);
