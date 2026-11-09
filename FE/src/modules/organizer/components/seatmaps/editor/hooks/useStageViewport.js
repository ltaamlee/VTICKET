import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const ZOOM_FACTOR = 1.1;

/**
 * ============================================================
 * HOOK QUẢN LÝ GÓC NHÌN (ZOOM / PAN)
 * ============================================================
 *
 * Stage Konva được phóng to / thu nhỏ và kéo qua `scaleX/scaleY` và
 * `x/y`. Hook này:
 *  - theo dõi kích thước khung chứa (ResizeObserver)
 *  - zoom tại vị trí con trỏ (giống Figma)
 *  - cung cấp nút zoom in / zoom out / đặt lại góc nhìn
 */
export default function useStageViewport({
    stageRef,
    containerRef,
    canvasWidth = 900,
    canvasHeight = 600,
}) {
    const [viewport, setViewport] = useState({
        width: 800,
        height: 600,
    });

    const [scale, setScale] = useState(0.6);

    const [position, setPosition] = useState({
        x: 0,
        y: 0,
    });

    // Đã tự căn góc nhìn lần đầu chưa.
    const initializedRef = useRef(false);

    // Theo dõi kích thước viewport.
    useEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        const observer = new ResizeObserver(([entry]) => {
            setViewport({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
            });
        });

        observer.observe(container);

        return () => observer.disconnect();
    }, [containerRef]);

    /**
     * Zoom tại một vị trí cụ thể trên stage.
     */
    const zoomAt = useCallback(
        (nextScale, pointer) => {
            const stage = stageRef.current;

            if (!stage || !pointer) return;

            const oldScale = stage.scaleX();

            const newScale = Math.min(
                MAX_SCALE,
                Math.max(MIN_SCALE, nextScale)
            );

            const point = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            const nextPosition = {
                x: pointer.x - point.x * newScale,
                y: pointer.y - point.y * newScale,
            };

            setScale(newScale);
            setPosition(nextPosition);
        },
        [stageRef]
    );

    /**
     * Zoom bằng con lăn chuột.
     */
    const handleWheel = useCallback(
        (event) => {
            event.evt.preventDefault();

            const stage = stageRef.current;

            if (!stage) return;

            const pointer = stage.getPointerPosition();

            if (!pointer) return;

            const direction = event.evt.deltaY > 0 ? -1 : 1;
            const currentScale = stage.scaleX();

            const nextScale =
                direction > 0
                    ? currentScale * ZOOM_FACTOR
                    : currentScale / ZOOM_FACTOR;

            zoomAt(nextScale, pointer);
        },
        [stageRef, zoomAt]
    );

    /**
     * Zoom in / out tại tâm viewport.
     */
    const zoomIn = useCallback(() => {
        const stage = stageRef.current;

        if (!stage) return;

        zoomAt(stage.scaleX() * 1.2, {
            x: viewport.width / 2,
            y: viewport.height / 2,
        });
    }, [stageRef, viewport, zoomAt]);

    const zoomOut = useCallback(() => {
        const stage = stageRef.current;

        if (!stage) return;

        zoomAt(stage.scaleX() / 1.2, {
            x: viewport.width / 2,
            y: viewport.height / 2,
        });
    }, [stageRef, viewport, zoomAt]);

    /**
     * Đặt lại góc nhìn: vừa khít sơ đồ trong khung chứa.
     */
    const resetView = useCallback(() => {
        const initialScale = Math.min(
            viewport.width / canvasWidth,
            viewport.height / canvasHeight,
            1
        );

        const nextScale = Math.max(MIN_SCALE, initialScale);

        setScale(nextScale);
        setPosition({
            x: (viewport.width - canvasWidth * nextScale) / 2,
            y: (viewport.height - canvasHeight * nextScale) / 2,
        });
    }, [viewport, canvasWidth, canvasHeight]);

    /**
     * Khi kết thúc kéo Stage -> lưu vị trí mới.
     */
    const handleStageDragEnd = useCallback(() => {
        const stage = stageRef.current;

        if (!stage) return;

        setPosition({
            x: stage.x(),
            y: stage.y(),
        });
    }, [stageRef]);

    // Tự căn góc nhìn lần đầu khi viewport đã đo được.
    useEffect(() => {
        if (initializedRef.current) return;

        if (!viewport.width || !viewport.height) return;

        initializedRef.current = true;

        resetView();
    }, [viewport, resetView]);

    return {
        viewport,
        scale,
        position,
        setScale,
        setPosition,
        zoomAt,
        zoomIn,
        zoomOut,
        resetView,
        handleStageDragEnd,
        handleWheel,
    };
}
