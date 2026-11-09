import { memo } from "react";
import { Group, Rect } from "react-konva";

/**
 * Sân khấu (zone loại STAGE).
 *
 * Vẽ bằng nền tối + nét gạch chéo ở hai đầu để phân biệt với
 * khu vực ghế ngồi / khu vực đứng.
 */
function StageShape({
    width = 200,
    height = 70,
    color = "#334155",
    stroke = "rgba(255,255,255,0.85)",
    strokeWidth = 2,
    listening = true,
    name,
}) {
    const w = Math.max(Number(width) || 0, 1);
    const h = Math.max(Number(height) || 0, 1);

    // Số vạch gạch chéo ở mỗi đầu sân khấu.
    const stripes = Math.max(2, Math.floor(h / 12));
    const stripeWidth = 6;

    return (
        <Group>
            <Rect
                x={0}
                y={0}
                width={w}
                height={h}
                fill={color}
                stroke={stroke}
                strokeWidth={strokeWidth}
                listening={listening}
                name={name}
            />

            {Array.from({ length: stripes }).map((_, index) => {
                const offset = (index * h) / stripes;

                return (
                    <Rect
                        key={`left-${index}`}
                        x={0}
                        y={offset}
                        width={stripeWidth}
                        height={h / stripes}
                        fill="rgba(255,255,255,0.12)"
                        listening={false}
                        rotation={0}
                    />
                );
            })}

            {Array.from({ length: stripes }).map((_, index) => {
                const offset = (index * h) / stripes;

                return (
                    <Rect
                        key={`right-${index}`}
                        x={w - stripeWidth}
                        y={offset}
                        width={stripeWidth}
                        height={h / stripes}
                        fill="rgba(255,255,255,0.12)"
                        listening={false}
                    />
                );
            })}
        </Group>
    );
}

export default memo(StageShape);
