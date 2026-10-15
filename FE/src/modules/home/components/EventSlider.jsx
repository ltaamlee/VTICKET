import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const events = [
  {
    id: 1,
    title: "Summer Music Festival 2026",
    description: "Enjoy an unforgettable night with amazing artists.",
    date: "20 Dec 2026",
    location: "Ho Chi Minh City",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: 2,
    title: "VietTech Conference 2026",
    description: "Connect, learn and explore the future of technology.",
    date: "25 Dec 2026",
    location: "Ho Chi Minh City",
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: 3,
    title: "Vietnam Football Championship",
    description: "Experience the excitement of the biggest football event.",
    date: "28 Dec 2026",
    location: "Hanoi",
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=80",
  },
];

function EventSlider() {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % events.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + events.length) % events.length);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const event = events[current];

  return (
    <section className="px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl bg-gray-900 shadow-lg">
          {/* Image */}
          <div className="relative sm:h-120">
            <img
              src={event.image}
              alt={event.title}
              className="h-full w-full object-cover transition-all duration-500"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-2xl px-6 sm:px-10 lg:px-16">
                <span className="inline-block rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white">
                  Featured Event
                </span>

                <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  {event.title}
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-gray-200 sm:text-base lg:text-lg">
                  {event.description}
                </p>

                <div className="mt-5 space-y-2 text-sm text-gray-200 sm:flex sm:gap-6 sm:space-y-0">
                  <span>📅 {event.date}</span>
                  <span>📍 {event.location}</span>
                </div>

                <Link
                  to={`/events/${event.id}`}
                  className="mt-7 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  View Event
                </Link>
              </div>
            </div>

            {/* Previous button */}
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous event"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-xl text-white backdrop-blur-sm transition hover:bg-white/40 sm:left-5"
            >
              ←
            </button>

            {/* Next button */}
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next event"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-xl text-white backdrop-blur-sm transition hover:bg-white/40 sm:right-5"
            >
              →
            </button>

            {/* Dots */}
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
              {events.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    current === index
                      ? "w-8 bg-white"
                      : "w-2.5 bg-white/50 hover:bg-white/80"
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