import { useState } from "react"
import SectionHeader from "../ui/SectionHeader"
import ProductCard from "./ProductCard"

export default function ProductCarousel({ title, to, products }) {
  const [paused, setPaused] = useState(false)

  if (!products || products.length === 0) return null

  // Duplicate the product items to enable seamless, infinite loop scrolling
  const track = [...products, ...products]

  // Slower speed for products so users can read the titles, prices, and ratings
  // Each product gets around 7.5 seconds of animation time, with a minimum of 35 seconds total
  const duration = Math.max(products.length * 7.5, 35)

  return (
    <section className="container-rs py-8">
      <SectionHeader title={title} to={to} />
      <div
        className="relative overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div
          className="products-marquee-track flex w-max gap-4 sm:gap-6"
          style={{
            animationDuration: `${duration}s`,
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {track.map((p, i) => (
            <div
              key={`${p._id}-${i}`}
              className="w-[260px] shrink-0 sm:w-[310px]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
