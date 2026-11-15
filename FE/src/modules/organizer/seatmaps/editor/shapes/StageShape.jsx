import { memo } from "react";
import { Group, Rect } from "react-konva";

import ZoneShape from "./ZoneShape";

/**
 * Sân khấu (zone loại STAGE).
 *
 * - Hỗ trợ cả hình chữ nhật (RECTANGLE) và các hình đa giác (POLYGON: chữ T, U, L...).
 * - Với hình chữ nhật, vẽ thêm các vạch gạch chéo ở hai đầu để phân biệt.
 */
function StageShape({
    shape = "RECTANGLE",
    width = 200,
    height = 70,
    points = null,
    holes = null,
    color = "#334155",
    stroke = "rgba(255,255,255,0.85)",
    strokeWidth = 2,
    listening = true,
    name,
}) {
    const w = Math.max(Number(width) || 0, 1);
    const h = Math.max(Number(height) || 0, 1);

    const isRect = !shape || shape === "RECTANGLE";

    // Số vạch gạch chéo ở mỗi đầu sân khấu (chỉ áp dụng cho hình chữ nhật).
    const stripes = Math.max(2, Math.floor(h / 12));
    const stripeWidth = 6;

    return (
        <Group>
            <ZoneShape
                shape={shape}
                width={w}
                height={h}
                points={points}
                holes={holes}
                color={color}
                stroke={stroke}
                strokeWidth={strokeWidth}
                listening={listening}
                name={name}
            />

            {isRect && (
                <>
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
                </>
            )}
        </Group>
    );
}

export default memo(StageShape);