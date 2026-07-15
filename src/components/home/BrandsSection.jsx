import { useState } from "react"
import { Link } from "react-router-dom"
import SectionHeader from "../ui/SectionHeader"
import Icon from "../ui/Icon"
import { toneGradient } from "../../lib/tones"
import { useBrands } from "../../hooks/useBrands"

function BrandCard({ brand }) {
  const className =
    "group flex h-28 w-[190px] shrink-0 flex-col items-center justify-center gap-2.5 rounded-2xl border border-white/8 bg-ink-850 px-5 transition hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-xl hover:shadow-black/30 sm:h-32 sm:w-[230px]"

  const content = (
    <>
      {brand.logo?.url ? (
        <img
          src={brand.logo.url}
          alt={brand.name}
          draggable={false}
          className="h-9 max-w-[150px] object-contain sm:h-10 sm:max-w-[180px]"
        />
      ) : (
        <>
          <span
            className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-lg transition group-hover:scale-105"
            style={toneGradient(brand.tone)}
          >
            <Icon name={brand.icon} size={22} />
          </span>
          <span className="truncate text-sm font-bold text-cloud-100">{brand.name}</span>
        </>
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
  const track = [...brands, ...brands]
  const duration = Math.max(brands.length * 4.5, 24)

  return (
    <div
      className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        className="brands-marquee-track flex w-max gap-3 sm:gap-4"
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
    <section id="brands" className="container-rs scroll-mt-32 py-8">
      <SectionHeader title="Our Brands" linkLabel="View All Brands" to="/brands" />
      {isLoading ? (
        <p className="text-sm text-cloud-500">Loading brands…</p>
      ) : (
        <BrandMarquee brands={brands || []} />
      )}
    </section>
  )
}
