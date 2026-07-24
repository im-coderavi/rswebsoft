import Hero from "../components/home/Hero"
import StatsStrip from "../components/home/StatsStrip"
import WhyChooseUs from "../components/home/WhyChooseUs"
import CategoriesGrid from "../components/home/CategoriesGrid"
import DynamicSection from "../components/home/DynamicSection"
import LatestStack from "../components/home/LatestStack"
import PricingPlans from "../components/home/PricingPlans"
import ClientsMarquee from "../components/home/ClientsMarquee"
import BrandsSection from "../components/home/BrandsSection"
import DemoCenter from "../components/home/DemoCenter"
import Testimonials from "../components/home/Testimonials"
import Newsletter from "../components/home/Newsletter"
import { useHomeSections } from "../hooks/useHomeSections"

export default function Home() {
  const { data: sections } = useHomeSections()

  return (
    <>
      <Hero />
      <StatsStrip />
      <WhyChooseUs />
      <CategoriesGrid />
      {(sections || []).map((section) => (
        <DynamicSection key={section._id} section={section} />
      ))}
      <LatestStack />
      <PricingPlans />
      <ClientsMarquee />
      <BrandsSection />
      <DemoCenter />
      <Testimonials />
      <Newsletter />
    </>
  )
}
