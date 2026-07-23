import { Link } from "react-router-dom"
import { ExternalLink, ArrowRight, Rocket } from "lucide-react"
import { motion } from "framer-motion"
import Icon from "../ui/Icon"
import { toneGradient } from "../../lib/tones"
import { useBrands } from "../../hooks/useBrands"
import { cleanText } from "../../lib/text"

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export default function BrandsSection() {
  const { data: brands, isLoading } = useBrands()

  if (!isLoading && (!brands || brands.length === 0)) return null

  return (
    <section id="brands" className="container-rs scroll-mt-32 py-12 md:py-16">
      {/* Centered Heading */}
      <div className="mb-10 text-center">
        <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.25em] text-brand-500">
          Our Brands
        </span>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-cloud-100 sm:text-3xl md:text-4xl">
          Our Brands, Our Pride
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-cloud-400">
          RSWebSoft is home to multiple powerful brands delivering innovative digital solutions, products &amp; services for businesses worldwide.
        </p>
        <div className="mx-auto mt-4 h-1 w-12 rounded bg-brand-500" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-ink-850" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
          {brands.slice(0, 10).map((brand, i) => (
            <motion.div
              key={brand._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
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

      {/* Bottom Success Banner */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 flex flex-col items-center gap-5 rounded-2xl border border-blue-100/50 bg-blue-50/20 bg-brand-gradient-soft p-5 dark:border-white/5 dark:bg-transparent sm:flex-row sm:justify-between sm:gap-6 sm:p-6"
      >
        <div className="flex items-center gap-4 text-left">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-md">
            <Rocket size={22} strokeWidth={2.2} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-cloud-100 sm:text-base">
              Building Digital Brands That Drive Success
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-cloud-300">
              From digital products to powerful tools &amp; services — our brands are built to empower businesses, creators &amp; entrepreneurs.
            </p>
          </div>
        </div>

        <Link
          to="/brands"
          className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-95 hover:shadow-lg"
        >
          Explore All Brands
          <ArrowRight size={16} strokeWidth={2.5} className="transition group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </section>
  )
}
