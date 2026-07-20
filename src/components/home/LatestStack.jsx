import { Link } from "react-router-dom"
import { Sparkles, ArrowRight } from "lucide-react"
import { useProducts } from "../../hooks/useProducts"
import Stack from "../ui/Stack"
import Reveal from "../ui/Reveal"

export default function LatestStack() {
  const { data, isLoading } = useProducts({ status: "published", limit: 5 })
  const products = data?.items || []

  if (isLoading || products.length === 0) return null

  const cards = products.map((product) => (
    <Link
      key={product._id}
      to={`/products/${product.slug}`}
      className="group relative block h-full w-full overflow-hidden"
    >
      <img
        src={product.images?.[0]?.url || "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format"}
        alt={product.name}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        draggable={false}
      />
      {/* Bottom details overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 text-left sm:p-5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-300">
          {product.category?.name || "Premium Product"}
        </span>
        <h3 className="line-clamp-1 text-sm font-bold text-white sm:text-base">
          {product.name}
        </h3>
        <p className="mt-1 text-xs font-semibold text-accent-400">
          ₹{product.salePrice || product.price}
        </p>
      </div>
    </Link>
  ))

  return (
    <section className="container-rs overflow-hidden py-12 sm:py-16">
      <div className="grid grid-cols-1 items-center gap-10 rounded-3xl border border-white/5 bg-ink-900/60 p-6 sm:p-10 lg:grid-cols-12">
        {/* Copy Column */}
        <div className="lg:col-span-7">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-200">
              <Sparkles size={13} /> Hot off the press
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-cloud-100 sm:text-3xl lg:text-4xl">
              Freshly Dropped Releases &amp; Tools
            </h2>
            <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-cloud-400 sm:text-base">
              Check out our latest digital products, templates, and plugins freshly loaded into the database. Drag or swipe cards to browse through them, or click directly on any card to view its live preview, features, and buy licenses.
            </p>
            <div className="mt-8">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 glow-shadow"
              >
                Explore New Arrivals <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Stack Slide Column */}
        <div className="flex justify-center lg:col-span-5">
          <Reveal delay={0.15}>
            <div className="relative grid h-[210px] w-[210px] place-items-center sm:h-[260px] sm:w-[260px] md:h-[280px] md:w-[280px] lg:h-[310px] lg:w-[310px]">
              {/* Outer ambient glow behind the stack */}
              <div className="pointer-events-none absolute -inset-4 rounded-full bg-brand-500/10 blur-xl" />
              <Stack
                cards={cards}
                randomRotation={true}
                sensitivity={90}
                autoplay={true}
                autoplayDelay={2000}
                pauseOnHover={true}
                sendToBackOnClick={false}
                animationConfig={{ stiffness: 380, damping: 25 }}
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
