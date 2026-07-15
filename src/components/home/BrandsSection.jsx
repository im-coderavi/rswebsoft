import { useState } from "react"
import { Link } from "react-router-dom"
import SectionHeader from "../ui/SectionHeader"
import Icon from "../ui/Icon"
import { toneGradient } from "../../lib/tones"
import { useBrands } from "../../hooks/useBrands"

function BrandCard({ brand }) {
  const className =
    "group flex h-16 w-[180px] shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-white px-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-md hover:shadow-black/5 sm:h-20 sm:w-[220px]"

  const content = (
    <>
      {brand.logo?.url ? (
        <img
          src={brand.logo.url}
          alt={brand.name}
          draggable={false}
          className="h-8 max-w-full object-contain transition duration-300 group-hover:scale-105 sm:h-10"
        />
      ) : (
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg text-white shadow"
            style={toneGradient(brand.tone)}
          >
            <Icon name={brand.icon} size={14} />
          </span>
          <span className="truncate text-xs font-bold text-slate-800">{brand.name}</span>
        </div>
      )}
    </>
  )

  // A brand's configured website link (set in the admin panel) is the click-through
  // target when present; otherwise the card falls back to the internal product filter.
  if (brand.website) {
    return (
      <a href={brand.website} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link to={`/products?brand=${brand._id}`} className={className}>
      {content}
    </Link>
  )
}

function BrandMarquee({ brands }) {
  const [paused, setPaused] = useState(false)
  
  if (!brands || brands.length === 0) return null

  // Ensure we have enough items to loop seamlessly on large displays
  let track = [...brands]
  while (track.length > 0 && track.length < 20) {
    track = [...track, ...brands]
  }

  // Consistent scrolling speed: ~2.5s per item
  const duration = track.length * 2.5

  return (
    <div
      className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        className="brands-marquee-track flex w-max gap-3 py-2 sm:gap-4"
        style={{ animationDuration: `${duration}s`, animationPlayState: paused ? "paused" : "running" }}
      >
        {track.map((brand, i) => (
          <BrandCard key={`${brand._id}-${i}`} brand={brand} />
        ))}
      </div>
    </div>
  )
}

export default function BrandsSection() {
  const { data: brands, isLoading } = useBrands()

  return (
    <section id="brands" className="scroll-mt-32 py-12 sm:py-16 bg-ink-900/20">
      <div className="container-rs text-center mb-8 sm:mb-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl lg:text-4xl">
          Trusted by{" "}
          <span className="relative inline-block text-emerald-500 dark:text-emerald-400">
            350+ Clients
            <span className="absolute left-0 bottom-0.5 h-[3px] w-full rounded bg-emerald-500" />
          </span>{" "}
          Worldwide
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-xs font-medium text-cloud-400 sm:text-sm md:text-base">
          Building High-Impact Websites &amp; Tailored Solutions That Drive Business Growth
        </p>
      </div>

      <div className="container-rs">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <p className="text-sm text-cloud-500 animate-pulse">Loading brands…</p>
          </div>
        ) : (
          <BrandMarquee brands={brands || []} />
        )}
      </div>
    </section>
  )
}
