import EventCard from "./EventCard";

const events = [
  {
    id: 1,
    title: "Summer Music Festival 2026",
    category: "Music",
    date: "20 Dec 2026",
    location: "Ho Chi Minh City",
    price: "200,000 VND",
    image: "",
  },
  {
    id: 2,
    title: "VietTech Conference 2026",
    category: "Technology",
    date: "25 Dec 2026",
    location: "Ho Chi Minh City",
    price: "300,000 VND",
    image: "",
  },
  {
    id: 3,
    title: "Vietnam Football Championship",
    category: "Sports",
    date: "28 Dec 2026",
    location: "Hanoi",
    price: "150,000 VND",
    image: "",
  },
];

function FeaturedEvents() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Discover
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Featured Events
            </h2>

            <p className="mt-2 text-gray-500">
              Popular events you might be interested in
            </p>
          </div>

          <a
            href="/events"
            className="hidden text-sm font-semibold text-blue-600 hover:text-blue-700 sm:block"
          >
            View all →
          </a>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedEvents;