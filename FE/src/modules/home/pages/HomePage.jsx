import EventSlider from "../components/EventSlider";
import CategorySection from "../components/CategorySection";
import FeaturedEvents from "../components/FeaturedEvents";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <EventSlider />

        <CategorySection />

        <FeaturedEvents />
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
