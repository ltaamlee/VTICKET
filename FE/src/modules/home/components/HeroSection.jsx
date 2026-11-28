import { useState } from "react";
import { useNavigate } from "react-router-dom";

function HeroSection() {
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/events?keyword=${encodeURIComponent(keyword.trim())}`);
    } else {
      navigate("/events");
    }
  };

  return (
    <section className="bg-linear-to-br from-blue-100 to-white px-4 py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl text-center">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-blue-800 sm:text-5xl lg:text-6xl">
          MUỐN CHIẾN THÌ TRÁNH <br /> HƠI NGẠI CHÔNG GAI
        </h1>

        <form onSubmit={handleSearch} className="mx-auto mt-8 mb-16 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm kiếm sự kiện, nghệ sĩ, địa điểm..."
            className="flex-1 rounded-lg bg-white px-5 py-3.5 text-gray-900 outline-none focus:ring-4 focus:ring-blue-300 shadow-sm"
          />

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-7 py-3.5 font-semibold text-white shadow-md transition hover:bg-blue-700 cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        <p className="mx-auto mt-6 max-w-2xl text-base text-blue-900 sm:text-lg">
          Khám phá và đặt vé cho hàng ngàn sự kiện âm nhạc, hội thảo và giải trí hàng đầu.
        </p>
      </div>
    </section>
  );
}

export default HeroSection;
