import { Link } from "react-router-dom"
import SectionHeader from "../ui/SectionHeader"
import Icon from "../ui/Icon"
import { toneGradient } from "../../lib/tones"
import { useBrands } from "../../hooks/useBrands"

export default function BrandsSection() {
  const { data: brands, isLoading } = useBrands()

  return (
    <section className="container-rs py-8">
      <SectionHeader title="Our Brands (Sister Concerns)" linkLabel="View All Brands" to="/products" />
      {isLoading ? (
        <p className="text-sm text-cloud-500">Loading brands…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {(brands || []).map((brand) => (
            <div
              key={brand._id}
              className="flex flex-col items-center rounded-2xl border border-white/8 bg-ink-850 p-4 text-center transition hover:-translate-y-1 hover:border-brand-500/40"
            >
              <span
                className="mb-3 grid h-12 w-12 place-items-center rounded-xl text-white shadow-lg"
                style={toneGradient(brand.tone)}
              >
                <Icon name={brand.icon} size={22} />
              </span>
              <span className="text-sm font-bold text-cloud-100">{brand.name}</span>
              <span className="mb-3 mt-0.5 text-[11px] text-cloud-400">{brand.tag}</span>
              <div className="mt-auto flex w-full flex-col gap-1.5">
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-brand-gradient px-2 py-1.5 text-[11px] font-semibold text-white transition hover:opacity-95"
                  >
                    Visit Website
                  </a>
                )}
                <Link
                  to={`/products?brand=${brand._id}`}
                  className="rounded-lg border border-white/12 px-2 py-1.5 text-[11px] font-semibold text-cloud-300 transition hover:bg-white/5"
                >
                  Explore Products
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
