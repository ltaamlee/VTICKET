import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../../event/services/eventService";

const defaultCategories = [
  { name: "Âm nhạc", icon: "🎵" },
  { name: "Thể thao", icon: "⚽" },
  { name: "Công nghệ", icon: "💻" },
  { name: "Festival", icon: "🎉" },
];

function CategorySection() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await getCategories();
        const list = res.data?.categories || (Array.isArray(res.data) ? res.data : []);
        if (list.length > 0) {
          setCategories(list);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    }
    fetchCats();
  }, []);

  const displayList = categories.length > 0 ? categories : defaultCategories;

  return (
    <section className="px-4 pb-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-gray-900">
          Khám phá theo danh mục
        </h2>
        <p className="mt-2 text-gray-500">
          Tìm kiếm sự kiện theo sở thích và lĩnh vực bạn quan tâm
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {displayList.map((category) => (
            <Link
              key={category.id || category.name}
              to={category.id ? `/events?categoryId=${category.id}` : `/events?keyword=${encodeURIComponent(category.name)}`}
              className="rounded-2xl bg-white p-6 text-center shadow-xs border border-gray-100 transition hover:-translate-y-1 hover:shadow-lg hover:border-blue-300"
            >
              <div className="text-4xl">
                {category.icon || "🎟️"}
              </div>

              <h3 className="mt-3 font-bold text-gray-900">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategorySection;
