import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const ZOOM_FACTOR = 1.1;

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

    // Đang giữ phím Space (để kéo canvas bằng chuột trái).
    const spacePressedRef = useRef(false);

    // Thông tin phiên pan đang chạy.
    const panRef = useRef(null);

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

    // ============================================================
    // PAN THỦ CÔNG
    // ============================================================

    /**
     * Bắt đầu kéo canvas.
     *
     * Chỉ bắt đầu khi:
     *  - bấm vào nền trống (target === stage), VÀ
     *  - dùng chuột phải HOẶC đang giữ phím Space.
     *
     * Nhờ vậy, kéo khu vực / tay nắm sẽ KHÔNG làm canvas di chuyển.
     */
    const startPan = useCallback(
        (event) => {
            const stage = stageRef.current;

            if (!stage) return;

            const nativeEvent = event.evt || {};

            // Chỉ chuột trái hoặc chuột giữa mới kéo được.
            const button = nativeEvent.button;

            const isRightButton = button === 2;
            const isMiddleButton = button === 1;
            const isLeftButton = button === 0;

            if (
                !isRightButton &&
                !isMiddleButton &&
                !(isLeftButton && spacePressedRef.current)
            ) {
                return;
            }

            if (nativeEvent.preventDefault) {
                nativeEvent.preventDefault();
            }

            const pointer = stage.getPointerPosition();

            if (!pointer) return;

            panRef.current = {
                startPointer: { x: pointer.x, y: pointer.y },
                startPosition: {
                    x: stage.x(),
                    y: stage.y(),
                },
            };
        },
        [stageRef]
    );

    // Di chuyển canvas trong lúc kéo.
    useEffect(() => {
        const handleMove = (event) => {
            const current = panRef.current;

            if (!current) return;

            const stage = stageRef.current;

            if (!stage) return;

            // Tính delta so với vị trí con trỏ lúc bắt đầu.
            // Konva chỉ cập nhật pointer khi sự kiện đi qua content
            // của nó, nên ở đây phải tự tính từ clientX/clientY.
            const contentRect = stage
                .container()
                ?.getBoundingClientRect();

            const pointer = {
                x: event.clientX - (contentRect?.left ?? 0),
                y: event.clientY - (contentRect?.top ?? 0),
            };

            const deltaX =
                pointer.x - current.startPointer.x;
            const deltaY =
                pointer.y - current.startPointer.y;

            const nextPosition = {
                x: current.startPosition.x + deltaX,
                y: current.startPosition.y + deltaY,
            };

            stage.position(nextPosition);

            setPosition(nextPosition);
        };

        const handleUp = () => {
            if (!panRef.current) return;

            panRef.current = null;
        };

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);

        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
        };
    }, [stageRef]);

    // Theo dõi phím Space để kéo canvas bằng chuột trái.
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.code === "Space") {
                spacePressedRef.current = true;
            }
        };

        const handleKeyUp = (event) => {
            if (event.code === "Space") {
                spacePressedRef.current = false;
            }
        };

        const handleBlur = () => {
            spacePressedRef.current = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleBlur);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleBlur);
        };
    }, []);

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
        startPan,
        handleWheel,
        spacePressedRef,
    };
}
