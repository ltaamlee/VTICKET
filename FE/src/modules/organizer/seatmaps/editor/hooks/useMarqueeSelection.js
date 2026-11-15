import { useCallback, useEffect, useRef, useState } from "react";

import { getCanvasPointer, rectFromPoints } from "../../../../../utils/canvas/konvaCoordinates";

/**
 * ============================================================
 * HOOK KÉO VÙNG CHỌN (MARQUEE)
 * ============================================================
 *
 * Bấm xuống nền trống rồi kéo -> vẽ vùng chọn; thả chuột -> chọn
 * tất cả zone nằm trong vùng đó.
 *
 * Giữ Shift / Ctrl để bổ sung vào vùng chọn hiện tại.
 */
export default function useMarqueeSelection({
    stageRef,
    onSelectZone,
    onSelectZonesInRect,
    spacePressedRef,
}) {
    const [marquee, setMarquee] = useState(null);

    // Ref giữ vùng kéo chọn hiện tại (listener không bị re-subscribe).
    const marqueeRef = useRef(null);

    const handlePointerUp = useCallback(() => {
        const current = marqueeRef.current;

        marqueeRef.current = null;
        setMarquee(null);

        if (!current) return;

        const rect = rectFromPoints(
            { x: current.startX, y: current.startY },
            { x: current.x, y: current.y }
        );

        // Chỉ coi là chọn nhiều khi kéo đủ lớn.
        if (rect.width > 4 || rect.height > 4) {
            onSelectZonesInRect?.(rect, {
                additive: current.additive,
            });
        } else if (!current.additive) {
            onSelectZone?.(null);
        }
    }, [onSelectZone, onSelectZonesInRect]);

    useEffect(() => {
        const handleMove = () => {
            const current = marqueeRef.current;

            if (!current) return;

            const point = getCanvasPointer(stageRef.current);

            const next = {
                ...current,
                x: point.x,
                y: point.y,
            };

            marqueeRef.current = next;
            setMarquee(next);
        };

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [stageRef, handlePointerUp]);

    /**
     * Bắt đầu kéo vùng chọn.
     */
    const startMarquee = useCallback(
        (event) => {
            if (
                event.evt?.button !== undefined &&
                event.evt.button !== 0
            ) {
                return;
            }

            // Giữ phím Space = dùng để kéo canvas, không kéo vùng chọn.
            if (spacePressedRef?.current) return;

            const point = getCanvasPointer(stageRef.current);

            const next = {
                startX: point.x,
                startY: point.y,
                x: point.x,
                y: point.y,
                additive:
                    event.evt?.shiftKey ||
                    event.evt?.ctrlKey ||
                    event.evt?.metaKey,
            };

            marqueeRef.current = next;
            setMarquee(next);
        },
        [stageRef, spacePressedRef]
    );

    return {
        marquee,
        startMarquee,
    };
}
