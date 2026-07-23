import { motion } from "framer-motion"
import { ExternalLink } from "lucide-react"
import Icon from "../components/ui/Icon"
import { toneGradient } from "../lib/tones"
import { useBrands } from "../hooks/useBrands"
import { cleanText } from "../lib/text"

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export default function Brands() {
  const { data: brands, isLoading } = useBrands()

  return (
    <div className="container-rs py-16">
      {/* Centered Heading */}
      <div className="mb-12 text-center">
        <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.25em] text-brand-500">
          Our Brands
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-cloud-100 sm:text-4xl md:text-5xl">
          Our Brands, Our Pride
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-cloud-400 md:text-base">
          RSWebSoft is home to multiple powerful brands delivering innovative digital solutions, products &amp; services for businesses worldwide.
        </p>
        <div className="mx-auto mt-5 h-1.5 w-16 rounded bg-brand-500" />
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-ink-850" />
          ))}
        </div>
      )}

      {!isLoading && (!brands || brands.length === 0) && (
        <p className="py-10 text-center text-cloud-400">No brands added yet.</p>
      )}

      {!isLoading && brands?.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
          {brands.map((brand, i) => (
            <motion.div
              key={brand._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="group flex min-w-0 flex-col items-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-200 hover:shadow-xl dark:border-white/5 dark:bg-ink-850 dark:hover:border-white/10 dark:hover:shadow-black/30"
            >
              {/* Logo Row */}
              <div className="mb-4 flex min-w-0 max-w-full items-center gap-2">
                {brand.logo?.url ? (
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink-800">
                    <img src={brand.logo.url} alt="" className="h-full w-full object-contain p-1" />
                  </span>
                ) : (
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
                    style={toneGradient(brand.tone)}
                  >
                    <Icon name={brand.icon} size={20} />
                  </span>
                )}
                <span className="truncate font-display text-lg font-extrabold tracking-tight text-slate-800 dark:text-cloud-100">
                  {cleanText(brand.name)}
                </span>
              </div>

              {/* Tag/Badge */}
              {brand.tag && (
                <div className="mb-3.5 max-w-full truncate rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-0.5 text-[10px] font-bold tracking-wide uppercase text-brand-400">
                  {cleanText(brand.tag)}
                </div>
              )}

              {/* Description */}
              {brand.description && (
                <p className="mb-5 line-clamp-3 break-words text-[13px] leading-relaxed text-slate-500 dark:text-cloud-400">
                  {cleanText(brand.description)}
                </p>
              )}

              {/* Full Width Pill Link */}
              {brand.website && (
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto flex w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-brand-500/10 py-2.5 text-[13px] font-semibold text-brand-400 transition-all duration-200 hover:bg-brand-500/20"
                >
                  <span className="truncate">{hostnameOf(brand.website)}</span>
                  <ExternalLink size={13} strokeWidth={2.5} className="shrink-0 opacity-85" />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
