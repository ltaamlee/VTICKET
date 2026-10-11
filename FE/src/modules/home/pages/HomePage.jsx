import HeroSection from "../components/HeroSection";
import FeaturedEvents from "../components/FeaturedEvents";
import CategorySection from "../components/CategorySection";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import EventSlider from "../components/EventSlider";

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        <HeroSection />
        <EventSlider />
        <FeaturedEvents />
        <CategorySection />
      </main>
    <Footer />
    </div>
  );
}

export default HomePage;