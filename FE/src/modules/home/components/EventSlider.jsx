import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ChevronLeft, ChevronRight, Ticket } from "lucide-react";
import { getFeaturedEvents } from "../../event/services/eventService";

const defaultSlides = [
    {
        id: "1",
        title: "Summer Music Festival 2026",
        description: "Đại nhạc hội bùng nổ cảm xúc với sự quy tụ của những nghệ sĩ hàng đầu.",
        date: "20 Tháng 12, 2026",
        location: "Trung tâm Hội chợ & Triển lãm Sài Gòn (SECC), TP. Hồ Chí Minh",
        image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
    },
    {
        id: "2",
        title: "VietTech Conference 2026",
        description: "Diễn đàn công nghệ và trí tuệ nhân tạo lớn nhất trong năm.",
        date: "25 Tháng 12, 2026",
        location: "Trung tâm Hội nghị Quốc gia, Hà Nội",
        image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=80",
    },
    {
        id: "3",
        title: "Vietnam Sports & Marathon Championship",
        description: "Giải chạy marathon quy mô quốc tế với hàng ngàn vận động viên tham dự.",
        date: "28 Tháng 12, 2026",
        location: "Bờ Hồ Hoàn Kiếm, Hà Nội",
        image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=80",
    },
];

function EventSlider() {
    const [slides, setSlides] = useState(defaultSlides);
    const [current, setCurrent] = useState(0);


    useEffect(() => {
        async function fetchFeatured() {
            try {
                const res = await getFeaturedEvents(5);
                const list = res.data?.events || (Array.isArray(res.data) ? res.data : []);
                if (list.length > 0) {
                    const formatted = list.map((ev) => ({
                        id: ev.slug || ev.id,
                        title: ev.name,
                        description: ev.description ? ev.description.slice(0, 140) + "..." : "Sự kiện đặc sắc đang mở bán vé trên VTICKET.",
                        date: ev.startAt ? new Date(ev.startAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "",
                        location: ev.location,
                        image: ev.bannerUrl || ev.thumbnailUrl || defaultSlides[0].image,
                    }));
                    setSlides(formatted);
                }
            } catch (err) {
                console.error("Lỗi khi tải slides sự kiện nổi bật:", err);
            }
        }
        fetchFeatured();
    }, []);

    const nextSlide = () => {
        setCurrent((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    };

    // Tự động chuyển slide sau mỗi 5 giây
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [slides.length]);

    const event = slides[current] || slides[0];

    return (
        <section className="px-4 pt-6 pb-8 sm:pt-8 sm:pb-12">
            <div className="mx-auto max-w-7xl">
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl">
                    {/* Ảnh nền Banner */}
                    <div className="relative h-[380px] sm:h-[460px] lg:h-[520px] w-full overflow-hidden">
                        <img
                            src={event.image}
                            alt={event.title}
                            className="h-full w-full object-cover transition-all duration-700 transform scale-100"
                        />

                        {/* Lớp phủ Gradient tối ưu đọc nội dung */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />

                        {/* Nội dung Banner */}
                        <div className="absolute inset-0 flex items-center">
                            <div className="max-w-2xl px-6 sm:px-12 lg:px-16 text-white space-y-4">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs backdrop-blur-xs">
                                    Sự kiện nổi bật
                                </span>

                                <h2 className="text-2xl font-black leading-tight sm:text-4xl lg:text-5xl line-clamp-2">
                                    {event.title}
                                </h2>

                                <p className="text-xs sm:text-sm lg:text-base leading-relaxed text-gray-200 line-clamp-2">
                                    {event.description}
                                </p>

                                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-200">
                                    {event.date && (
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
                                            <span>{event.date}</span>
                                        </div>
                                    )}
                                    {event.location && (
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                                            <span className="line-clamp-1">{event.location}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3">
                                    <Link
                                        to={`/events/${event.id}`}
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-sm text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-[0.98]"
                                    >
                                        <Ticket className="h-4 w-4" />
                                        Xem chi tiết & Mua vé
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Nút lùi Slide */}
                        <button
                            type="button"
                            onClick={prevSlide}
                            aria-label="Previous slide"
                            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/40 sm:left-5 cursor-pointer"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        {/* Nút tiến Slide */}
                        <button
                            type="button"
                            onClick={nextSlide}
                            aria-label="Next slide"
                            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/40 sm:right-5 cursor-pointer"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>

                        {/* Dấu chấm chỉ báo Dots */}
                        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 z-10">
                            {slides.map((item, index) => (
                                <button
                                    key={item.id || index}
                                    type="button"
                                    onClick={() => setCurrent(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                    className={`h-2 rounded-full transition-all cursor-pointer ${
                                        current === index
                                            ? "w-8 bg-blue-500 shadow-md"
                                            : "w-2 bg-white/50 hover:bg-white/80"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default EventSlider;
