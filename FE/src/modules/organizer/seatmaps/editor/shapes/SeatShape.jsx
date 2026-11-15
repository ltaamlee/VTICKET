import { memo } from "react";
import { Group, Rect, Text } from "react-konva";

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

    const showLabel = size >= 13 && !isRemoved;
    const fontSize = Math.max(7, Math.floor(size * 0.45));

    return (
        <Group
            x={x}
            y={y}
            listening={seatTool !== "none"}
            onClick={(e) => {
                e.cancelBubble = true;
                onSeatCellClick?.(cell);
            }}
            onTap={(e) => {
                e.cancelBubble = true;
                onSeatCellClick?.(cell);
            }}
        >
            <Rect
                x={0}
                y={0}
                width={size}
                height={size}
                cornerRadius={Math.min(3, size / 4)}
                fill={fill}
                stroke={stroke}
                strokeWidth={1}
                dash={isRemoved ? [3, 2] : undefined}
            />

            {/* Hiển thị số ghế */}
            {showLabel && (
                <Text
                    x={0}
                    y={0}
                    width={size}
                    height={size}
                    text={cell?.seatNumber || ""}
                    fontSize={fontSize}
                    fontStyle="bold"
                    fill={isBlocked ? "rgba(255,255,255,0.4)" : "#ffffff"}
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                />
            )}
        </Group>
    );
}

export default memo(SeatShape);