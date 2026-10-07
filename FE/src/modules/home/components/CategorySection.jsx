import { Link } from "react-router-dom";

const categories = [
  {
    name: "Âm nhạc",
    icon: "🎵",
  },
  {
    name: "Thể thao",
    icon: "⚽",
  },
  {
    name: "Công nghệ",
    icon: "💻",
  },
  {
    name: "Festival",
    icon: "🎉",
  },
];

function CategorySection() {
  return (
    <section className="px-4 pb-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-gray-900">
          Explore Categories
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={`/events?category=${category.name}`}
              className="rounded-xl bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-4xl">{category.icon}</div>

              <h3 className="mt-3 font-semibold text-gray-900">
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