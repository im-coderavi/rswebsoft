import Hero from "../components/home/Hero"
import StatsStrip from "../components/home/StatsStrip"
import CategoriesGrid from "../components/home/CategoriesGrid"
import ProductCarousel from "../components/home/ProductCarousel"
import ReadyWebsites from "../components/home/ReadyWebsites"
import BrandsSection from "../components/home/BrandsSection"
import DemoCenter from "../components/home/DemoCenter"
import Testimonials from "../components/home/Testimonials"
import Newsletter from "../components/home/Newsletter"
import { popularPlugins, premiumThemes } from "../data/site"

export default function Home() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <CategoriesGrid />
      <ProductCarousel title="Popular WordPress Plugins" to="/plugins" products={popularPlugins} />
      <ProductCarousel title="Premium WordPress Themes" to="/themes" products={premiumThemes} />
      <ReadyWebsites />
      <BrandsSection />
      <DemoCenter />
      <Testimonials />
      <Newsletter />
    </>
  )
}
