
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../../event/services/eventService";

function CategorySection() {
    const [categories, setCategories] = useState([]);
    const [copyCount, setCopyCount] = useState(2);

    const sliderRef = useRef(null);
    const groupRef = useRef(null);
    const pauseRef = useRef(false);
    const animationRef = useRef(null);
    const dragRef = useRef({
        isDragging: false,
        startX: 0,
        startScrollLeft: 0,
        moved: false,
    });

    // Lấy danh mục động từ API
    useEffect(() => {
        let isMounted = true;

        async function fetchCategories() {
            try {
                const res = await getCategories();

                const list =
                    res.data?.categories ||
                    (Array.isArray(res.data) ? res.data : []);

                if (isMounted) {
                    setCategories(list);
                }
            } catch (err) {
                console.error("Lỗi khi tải danh mục:", err);
            }
        }

        fetchCategories();

        return () => {
            isMounted = false;
        };
    }, []);

    // Tính số bản sao để slider luôn đủ chiều rộng
    useEffect(() => {
        const slider = sliderRef.current;
        const group = groupRef.current;

        if (!slider || !group || categories.length === 0) return;

        const updateCopies = () => {
            const groupWidth = group.offsetWidth;

            if (!groupWidth) return;

            const count = Math.max(
                2,
                Math.ceil(slider.clientWidth / groupWidth) + 2
            );

            setCopyCount(count);
        };

        updateCopies();

        const observer = new ResizeObserver(updateCopies);
        observer.observe(slider);
        observer.observe(group);

        return () => observer.disconnect();
    }, [categories]);

    // Tự động trượt liên tục
    useEffect(() => {
        const slider = sliderRef.current;
        const group = groupRef.current;

        if (!slider || !group || categories.length === 0) return;

        let lastTime = 0;
        const speed = 30;

        const animate = (time) => {
            if (lastTime && !pauseRef.current) {
                const delta = Math.min(time - lastTime, 50);

                slider.scrollLeft += (speed * delta) / 1000;

                const groupWidth = group.offsetWidth;

                if (groupWidth > 0 && slider.scrollLeft >= groupWidth) {
                    slider.scrollLeft -= groupWidth;
                }
            }

            lastTime = time;
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [categories, copyCount]);

    // Kéo slider bằng chuột
    const handlePointerDown = (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;

        const slider = sliderRef.current;
        if (!slider) return;

        dragRef.current = {
            isDragging: true,
            startX: e.clientX,
            startScrollLeft: slider.scrollLeft,
            moved: false,
        };

        pauseRef.current = true;
    };

    const handlePointerMove = (e) => {
        const drag = dragRef.current;
        const slider = sliderRef.current;

        if (!drag.isDragging || !slider) return;

        const distance = e.clientX - drag.startX;

        if (Math.abs(distance) > 5) {
            drag.moved = true;
        }

        if (drag.moved) {
            slider.scrollLeft = drag.startScrollLeft - distance;
        }
    };

    const handlePointerUp = () => {
        dragRef.current.isDragging = false;
        pauseRef.current = false;
    };

    const handleClickCapture = (e) => {
        if (dragRef.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            dragRef.current.moved = false;
        }
    };

    // Hiển thị một danh mục
    const renderCategory = (category, index) => {
        const categoryId = category.id || category._id;
        const categoryName = category.name || "Danh mục";

        const image =
            category.image ||
            category.imageUrl ||
            category.thumbnail ||
            category.coverImage;

        const isImageUrl =
            typeof category.icon === "string" &&
            /^(https?:\/\/|\/)/.test(category.icon);

        const icon = isImageUrl ? category.icon : category.icon;

        return (
            <Link
                key={`${categoryId || categoryName}-${index}`}
                to={
                    categoryId
                        ? `/events?categoryId=${categoryId}`
                        : `/events?keyword=${encodeURIComponent(categoryName)}`
                }
                draggable={false}
                onClickCapture={handleClickCapture}
                className="group flex w-32 shrink-0 flex-col items-center text-center sm:w-36"
            >
                <div className="mb-2 h-24 w-24 overflow-hidden rounded-full bg-gray-100 sm:h-28 sm:w-28">
                    {image || isImageUrl ? (
                        <img
                            src={image || icon}
                            alt={categoryName}
                            draggable={false}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-4xl transition-transform duration-500 group-hover:scale-110">
                            {category.icon || "🎟️"}
                        </div>
                    )}
                </div>

                <h3 className="text-sm font-medium text-gray-800 transition-colors group-hover:text-blue-600 sm:text-base">
                    {categoryName}
                </h3>
            </Link>
        );
    };

    if (categories.length === 0) {
        return null;
    }

    return (
        <section className="overflow-hidden px-4 py-10">
            <div className="mx-auto max-w-7xl">
                <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
                    Khám phá theo danh mục
                </h2>

                <div
                    ref={sliderRef}
                    onMouseEnter={() => {
                        if (!dragRef.current.isDragging) {
                            pauseRef.current = true;
                        }
                    }}
                    onMouseLeave={handlePointerUp}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onTouchStart={() => {
                        pauseRef.current = true;
                    }}
                    onTouchEnd={() => {
                        pauseRef.current = false;
                    }}
                    className={`flex gap-8 overflow-x-auto pb-3 ${dragRef.current.isDragging ? "cursor-grabbing" : "cursor-grab"
                        }`}
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        scrollBehavior: "auto",
                        touchAction: "pan-x",
                    }}
                >
                    {Array.from({ length: copyCount }, (_, groupIndex) => (
                        <div
                            key={groupIndex}
                            ref={groupIndex === 0 ? groupRef : null}
                            className="flex shrink-0 gap-8"
                            aria-hidden={groupIndex !== 0}
                        >
                            {categories.map((category, index) =>
                                renderCategory(category, index)
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default CategorySection;