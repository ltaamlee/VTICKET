import { Link } from "react-router-dom";

function EventCard({ event }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="h-48 bg-gray-200">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            Event Image
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-sm font-medium text-blue-600">
          {event.category}
        </p>

        <h3 className="mt-2 line-clamp-2 text-lg font-bold text-gray-900">
          {event.title}
        </h3>

        <div className="mt-4 space-y-2 text-sm text-gray-500">
          <p>📅 {event.date}</p>
          <p>📍 {event.location}</p>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="font-semibold text-gray-900">
            From {event.price}
          </span>

          <Link
            to={`/events/${event.id}`}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            View Event
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EventCard;