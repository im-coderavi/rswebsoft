import { motion } from "framer-motion"
import Icon from "../components/ui/Icon"
import { toneGradient } from "../lib/tones"
import { useBrands } from "../hooks/useBrands"

export default function Brands() {
  const { data: brands, isLoading } = useBrands()

  return (
    <div className="container-rs py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-cloud-100 sm:text-3xl">All Brands</h1>
        <p className="mt-2 text-sm text-cloud-400">Every sister-concern brand under RSWebSoft, in one place.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-cloud-500">Loading brands…</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {(brands || []).map((brand, i) => (
            <motion.div
              key={brand._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/8 bg-ink-850 p-4 text-center transition hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-xl hover:shadow-black/30 sm:p-6"
            >
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-80"
                style={toneGradient(brand.tone)}
              />
              {brand.logo?.url ? (
                <div className="mb-3 flex h-14 w-full items-center justify-center rounded-xl bg-white p-2 border border-slate-100/50">
                  <img
                    src={brand.logo.url}
                    alt={brand.name}
                    draggable={false}
                    className="h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <span
                  className="mb-3 grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-lg transition group-hover:scale-105 sm:h-14 sm:w-14"
                  style={toneGradient(brand.tone)}
                >
                  <Icon name={brand.icon} size={24} />
                </span>
              )}
              <span className="min-w-0 truncate text-sm font-bold text-cloud-100">{brand.name}</span>
              <span className="mt-0.5 min-w-0 truncate text-xs text-cloud-400">{brand.tag}</span>
              <div className="mt-4 w-full">
                <a
                  href={brand.website || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate rounded-lg bg-brand-gradient px-2 py-1.5 text-xs font-semibold text-white transition hover:opacity-95"
                >
                  View Website
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
