import { memo } from "react";
import { Circle, Group, Label, Layer, Rect, Tag, Text } from "react-konva";

/**
 * Lớp overlay hiển thị:
 *  - Khung bao của nhóm
 *  - Khung bao vùng chọn nhiều ( xanh lam ).
 *  - Nhãn số lượng khu vực.
 */
function SelectionLayer({
    groupBounds = null,
    groupCount = 0,
    selectionBounds = null,
    selectionCount = 0,
    showSelection = false,
}) {
    const hasGroup = Boolean(groupBounds);
    const hasSelection = showSelection && Boolean(selectionBounds);

    if (!hasGroup && !hasSelection) return null;

    return (
        <Layer listening={false}>
            {/* Khung bao của nhóm đang chọn */}
            {hasGroup && (
                <Group>
                    <Rect
                        x={groupBounds.x}
                        y={groupBounds.y}
                        width={groupBounds.width}
                        height={groupBounds.height}
                        stroke="#A855F7"
                        strokeWidth={2}
                        dash={[8, 6]}
                        listening={false}
                    />

                    <Label
                        x={groupBounds.x + groupBounds.width}
                        y={groupBounds.y - 24}
                        listening={false}
                    >
                        <Tag
                            fill="#A855F7"
                            cornerRadius={3}
                            listening={false}
                        />

                        <Text
                            text={`Nhóm ${groupCount} khu vực`}
                            fill="#FFFFFF"
                            fontSize={10}
                            fontStyle="bold"
                            padding={4}
                            listening={false}
                        />
                    </Label>
                </Group>
            )}

            {/* Khung bao của vùng chọn nhiều */}
            {hasSelection && !hasGroup && (
                <Group>
                    <Rect
                        x={selectionBounds.x}
                        y={selectionBounds.y}
                        width={selectionBounds.width}
                        height={selectionBounds.height}
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dash={[8, 6]}
                        listening={false}
                    />

                    <Label
                        x={selectionBounds.x}
                        y={selectionBounds.y - 24}
                        listening={false}
                    >
                        <Tag
                            fill="#3B82F6"
                            cornerRadius={3}
                            listening={false}
                        />

                        <Text
                            text={`${selectionCount} đối tượng`}
                            fill="#FFFFFF"
                            fontSize={10}
                            fontStyle="bold"
                            padding={4}
                            listening={false}
                        />
                    </Label>
                </Group>
            )}

            {/* Chấm neo ở 4 góc của khung nhóm */}
            {hasGroup &&
                [
                    [groupBounds.x, groupBounds.y],
                    [
                        groupBounds.x + groupBounds.width,
                        groupBounds.y,
                    ],
                    [
                        groupBounds.x,
                        groupBounds.y + groupBounds.height,
                    ],
                    [
                        groupBounds.x + groupBounds.width,
                        groupBounds.y + groupBounds.height,
                    ],
                ].map(([cx, cy], index) => (
                    <Circle
                        key={index}
                        x={cx}
                        y={cy}
                        radius={3}
                        fill="#A855F7"
                        listening={false}
                    />
                ))}
        </Layer>
    );
}

export default memo(SelectionLayer);
