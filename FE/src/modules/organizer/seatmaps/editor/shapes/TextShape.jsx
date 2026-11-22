import { memo } from "react";
import { Group, Rect, Text } from "react-konva";

function TextShape({
    name = "",
    capacity = null,
    capacityLabel = "",
    x = 0,
    y = 0,
    width = 120,
    height = 60,
    nameFontSize = 11,
    capacityFontSize = 9,
    listening = false,
}) {
    const showCapacity = capacity !== null;

    return (
        <Group x={x} y={y} listening={listening}>
            <Text
                x={0}
                y={0}
                width={width}
                height={height}
                text={name}
                align="center"
                verticalAlign="middle"
                fontSize={nameFontSize}
                fontStyle="bold"
                fill="#FFFFFF"
                wrap="none"
                ellipsis
                listening={false}
                shadowColor="#000000"
                shadowBlur={2}
                shadowOpacity={0.5}
                shadowOffsetY={1}
            />

            {showCapacity && (
                <>
                    <Rect
                        x={width / 2 - 18}
                        y={height / 2 + 9}
                        width={36}
                        height={capacityFontSize + 6}
                        cornerRadius={3}
                        fill="rgba(0,0,0,0.25)"
                        listening={false}
                    />

                    <Text
                        x={0}
                        y={height / 2 + 10}
                        width={width}
                        height={capacityFontSize + 6}
                        text={capacityLabel}
                        align="center"
                        verticalAlign="middle"
                        fontSize={capacityFontSize}
                        fontStyle="bold"
                        fill="#FFFFFF"
                        listening={false}
                    />
                </>
            )}
        </Group>
    );
}

export default memo(TextShape);
