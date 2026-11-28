import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import EventCard from "../../event/components/common/EventCard";
import { getFeaturedEvents } from "../../event/services/eventService";

function FeaturedEvents() {
  const [featuredList, setFeaturedList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await getFeaturedEvents(6);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setFeaturedList(res.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải sự kiện nổi bật:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Sự kiện nổi bật
            </h2>
            <p className="mt-2 text-gray-500">
              Sự kiện được yêu thích mà bạn có thể quan tâm
            </p>
          </div>

          <Link
            to="/events"
            className="hidden text-sm font-semibold text-blue-600 hover:text-blue-700 sm:block"
          >
            Xem tất cả sự kiện →
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : featuredList.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredList.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-500">
              Chưa có sự kiện nổi bật nào. Hãy khám phá danh sách đầy đủ!
            </p>
            <Link
              to="/events"
              className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              Xem danh sách sự kiện
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedEvents;
