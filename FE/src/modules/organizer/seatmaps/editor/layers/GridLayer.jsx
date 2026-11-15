import { memo, useMemo } from "react";
import { Layer, Line } from "react-konva";

function GridLayer({
    width,
    height,
    gridSize = 20,
    visible = true,
    gridColor = "#E5E7EB",
}) {
    const lines = useMemo(() => {
        if (!visible || gridSize <= 0) return [];

        const result = [];

        // Đường dọc.
        for (let x = gridSize; x < width; x += gridSize) {
            result.push(
                <Line
                    key={`v-${x}`}
                    points={[x, 0, x, height]}
                    stroke={gridColor}
                    strokeWidth={0.5}
                    listening={false}
                />
            );
        }

        // Đường ngang.
        for (let y = gridSize; y < height; y += gridSize) {
            result.push(
                <Line
                    key={`h-${y}`}
                    points={[0, y, width, y]}
                    stroke={gridColor}
                    strokeWidth={0.5}
                    listening={false}
                />
            );
        }

        return result;
    }, [visible, gridSize, width, height, gridColor]);

    if (lines.length === 0) return null;

    return <Layer listening={false}>{lines}</Layer>;
}

export default memo(GridLayer);
