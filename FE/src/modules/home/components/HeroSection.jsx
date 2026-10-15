import { Link } from "react-router-dom";

function HeroSection() {
  return (
    <section className="bg-linear-to-br from-blue-100 to-white px-4 py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl text-center">

            <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-blue-800 sm:text-5xl lg:text-6xl">
            MUỐN CHIẾN THÌ TRÁNH <br /> HƠI NGẠI CHÔNG GAI
            </h1>

            <div className="mx-auto mt-8 mb-16 flex max-w-2xl flex-col gap-3 sm:flex-row">
                <input
                type="text"
                placeholder="Tìm kiếm sự kiện..."
                className="flex-1 rounded-lg bg-white px-5 py-3.5 text-gray-900 outline-none focus:ring-4 focus:ring-blue-300"
                />

                <button className="rounded-lg bg-gray-500 px-7 py-3.5 font-semibold text-white transition hover:bg-gray-800">
                Tìm kiếm
                </button>
            </div> 

            <p className="mx-auto mt-6 max-w-2xl text-base text-blue-900 sm:text-lg">
            Chông gai đã quen rồi, nhưng tôi chưa quen <br />
            Hạt mầm ngày nào giờ đâm chồi, nhưng tôi chưa đâm
            </p>

      </div>
    </section>
  );
}

export default HeroSection;