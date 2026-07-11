import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import SectionHeader from "../ui/SectionHeader"
import Icon from "../ui/Icon"
import { toneGradient } from "../../lib/tones"
import { useBrands } from "../../hooks/useBrands"

export default function BrandsSection() {
  const { data: brands, isLoading } = useBrands()

  return (
    <section id="brands" className="container-rs scroll-mt-32 py-8">
      <SectionHeader title="Our Brands (Sister Concerns)" linkLabel="View All Brands" to="/products" />
      {isLoading ? (
        <p className="text-sm text-cloud-500">Loading brands…</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {(brands || []).map((brand, i) => (
            <motion.div
              key={brand._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/8 bg-ink-850 p-3.5 text-center transition hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-xl hover:shadow-black/30 sm:p-5"
            >
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-80"
                style={toneGradient(brand.tone)}
              />
              <span
                className="mb-3 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-lg transition group-hover:scale-105 sm:h-14 sm:w-14"
                style={toneGradient(brand.tone)}
              >
                <Icon name={brand.icon} size={20} className="sm:hidden" />
                <Icon name={brand.icon} size={26} className="hidden sm:block" />
              </span>
              <span className="min-w-0 truncate text-xs font-bold text-cloud-100 sm:text-sm">{brand.name}</span>
              <span className="mt-0.5 min-w-0 truncate text-[10px] text-cloud-400 sm:text-xs">{brand.tag}</span>
              {brand.productCount > 0 && (
                <span className="mt-1.5 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-300">
                  {brand.productCount} Products
                </span>
              )}
              <div className="mt-3 flex w-full flex-col gap-1.5 sm:mt-4">
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate rounded-lg bg-brand-gradient px-2 py-1.5 text-[10px] font-semibold text-white transition hover:opacity-95 sm:text-[11px]"
                  >
                    Visit Website
                  </a>
                )}
                <Link
                  to={`/products?brand=${brand._id}`}
                  className="truncate rounded-lg border border-white/12 px-2 py-1.5 text-[10px] font-semibold text-cloud-300 transition hover:bg-white/5 sm:text-[11px]"
                >
                  Explore Products
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
