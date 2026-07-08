import { useRef, useState } from "react"
import SectionHeader from "../ui/SectionHeader"
import ProductCard from "./ProductCard"

export default function ProductCarousel({ title, to, products }) {
  const trackRef = useRef(null)
  const [page, setPage] = useState(0)
  const pages = 3

  const scrollToPage = (i) => {
    const el = trackRef.current
    if (!el) return
    setPage(i)
    el.scrollTo({ left: (el.scrollWidth / pages) * i, behavior: "smooth" })
  }

  const onScroll = () => {
    const el = trackRef.current
    if (!el) return
    const i = Math.round(el.scrollLeft / (el.scrollWidth / pages))
    setPage(Math.min(pages - 1, Math.max(0, i)))
  }

  return (
    <section className="container-rs py-8">
      <SectionHeader title={title} to={to} />
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-1"
      >
        {products.map((p) => (
          <div
            key={p._id}
            className="w-[calc(50%-0.5rem)] shrink-0 snap-start sm:w-[calc(33.333%-0.75rem)] lg:w-[calc(16.666%-0.834rem)]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {/* pagination dots */}
      <div className="mt-5 flex justify-center gap-2">
        {Array.from({ length: pages }).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToPage(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={[
              "h-2 rounded-full transition-all",
              i === page ? "w-6 bg-brand-gradient" : "w-2 bg-ink-600 hover:bg-ink-700",
            ].join(" ")}
          />
        ))}
      </div>
    </section>
  )
}
