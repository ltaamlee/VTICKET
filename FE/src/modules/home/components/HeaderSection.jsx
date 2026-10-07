import { Link } from "react-router-dom";

function HeaderSection() {
  return (
    <section className="bg-blue-600 px-4 py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-100">
          VTicket
        </p>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          Find Your Next Amazing Event
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-blue-100 sm:text-lg">
          Discover concerts, festivals, sports and other exciting events.
          Find your tickets and enjoy unforgettable experiences.
        </p>

        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search for events..."
            className="flex-1 rounded-lg bg-white px-5 py-3.5 text-gray-900 outline-none focus:ring-4 focus:ring-blue-300"
          />

          <button className="rounded-lg bg-gray-900 px-7 py-3.5 font-semibold text-white transition hover:bg-gray-800">
            Search
          </button>
        </div>

        <div className="mt-6">
          <Link
            to="/events"
            className="text-sm font-medium text-white underline underline-offset-4 hover:text-blue-100"
          >
            Explore all events →
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HeaderSection;