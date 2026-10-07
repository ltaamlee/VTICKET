import HeaderSection from "../components/HeaderSection";
import FeaturedEvents from "../components/FeaturedEvents";
import CategorySection from "../components/CategorySection";
import Header from "../../../components/layout/Header";

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        <HeaderSection />
        <FeaturedEvents />
        <CategorySection />
      </main>

    </div>
  );
}

export default HomePage;