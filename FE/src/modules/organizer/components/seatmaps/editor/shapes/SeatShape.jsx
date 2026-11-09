import { memo } from "react";
import { Rect } from "react-konva";

/**
 * Một ô ghế trong lưới ghế.
 *
 * - Ghế bình thường: nền trắng mờ.
 * - Ghế bị khoá: nền tối.
 * - Ô đã bị xoá: nét đứt (vẫn bấm được để khôi phục).
 */
function SeatShape({
    cell,
    x,
    y,
    size,
    seatTool = "none",
    onSeatCellClick,
}) {
    const isRemoved = Boolean(cell?.removed);
    const isBlocked = Boolean(cell?.blocked);

    const fill = isRemoved
        ? "rgba(239,68,68,0.18)"
        : isBlocked
          ? "rgba(15,23,42,0.55)"
          : "rgba(255,255,255,0.28)";

    const stroke = isRemoved
        ? "rgba(248,113,113,0.75)"
        : isBlocked
          ? "rgba(255,255,255,0.35)"
          : "rgba(255,255,255,0.7)";

    return (
        <Rect
            x={x}
            y={y}
            width={size}
            height={size}
            cornerRadius={Math.min(3, size / 4)}
            fill={fill}
            stroke={stroke}
            strokeWidth={1}
            dash={isRemoved ? [3, 2] : undefined}
            // Chỉ lắng nghe sự kiện khi đang dùng công cụ ghế,
            // tránh chặn thao tác kéo / chọn khu vực.
            listening={seatTool !== "none"}
            onPointerDown={(event) => {
                event.cancelBubble = true;
            }}
            onClick={(event) => {
                event.cancelBubble = true;

                onSeatCellClick?.(cell);
            }}
            onTap={(event) => {
                event.cancelBubble = true;

                onSeatCellClick?.(cell);
            }}
        />
    );
}

export default memo(SeatShape);
