import Hero from "../components/home/Hero"
import StatsStrip from "../components/home/StatsStrip"
import WhyChooseUs from "../components/home/WhyChooseUs"
import CategoriesGrid from "../components/home/CategoriesGrid"
import FeaturedProducts from "../components/home/FeaturedProducts"
import LatestStack from "../components/home/LatestStack"
import ProductCarousel from "../components/home/ProductCarousel"
import ReadyWebsites from "../components/home/ReadyWebsites"
import DeliveredWebsites from "../components/home/DeliveredWebsites"
import PricingPlans from "../components/home/PricingPlans"
import ClientsMarquee from "../components/home/ClientsMarquee"
import BrandsSection from "../components/home/BrandsSection"
import DemoCenter from "../components/home/DemoCenter"
import Testimonials from "../components/home/Testimonials"
import Newsletter from "../components/home/Newsletter"
import { useProducts } from "../hooks/useProducts"

function TypeCarousel({ title, type }) {
  // High limit so every published product of this type shows up here —
  // the admin panel is the only thing controlling how many actually exist.
  const { data, isLoading } = useProducts({ type, status: "published", limit: 100 })
  const products = data?.items || []

  if (!isLoading && products.length === 0) return null
  if (isLoading) return null

  return <ProductCarousel title={title} to={`/products?type=${type}`} products={products} />
}

export default function Home() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <WhyChooseUs />
      <CategoriesGrid />
      <FeaturedProducts />
      <LatestStack />
      <TypeCarousel title="Popular WordPress Plugins" type="plugin" />
      <TypeCarousel title="Premium WordPress Themes" type="theme" />
      <ReadyWebsites />
      <DeliveredWebsites />
      <TypeCarousel title="Handy Tools" type="tool" />
      <TypeCarousel title="Source Codes" type="source-code" />
      <TypeCarousel title="SaaS Software" type="saas" />
      <PricingPlans />
      <ClientsMarquee />
      <BrandsSection />
      <DemoCenter />
      <Testimonials />
      <Newsletter />
    </>
  )
}
