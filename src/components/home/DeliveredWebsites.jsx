import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useProducts } from "../../hooks/useProducts"

function DeliveredWebsiteCard({ product }) {
  const displayTag = product.tags?.[0] || product.category?.name || "Website"

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-ink-850 p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-500/40 hover:shadow-2xl hover:shadow-black/40">
      {/* Browser Window Mockup */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-ink-800 border border-white/5 shadow-inner">
        {/* Browser Top Bar */}
        <div className="flex items-center gap-1.5 bg-ink-900/60 px-3 py-2 border-b border-white/5">
          <div className="h-2 w-2 rounded-full bg-rose-500/80" />
          <div className="h-2 w-2 rounded-full bg-amber-500/80" />
          <div className="h-2 w-2 rounded-full bg-emerald-500/80" />
          <div className="ml-3 flex h-4 flex-1 items-center rounded bg-ink-850/50 px-2 text-[9px] text-cloud-500 truncate select-none">
            {product.demoUrl ? product.demoUrl.replace(/^https?:\/\//, "") : product.name.toLowerCase()}
          </div>
        </div>

        {/* Website Image Preview */}
        <div className="relative h-[calc(100%-24px)] w-full overflow-hidden bg-ink-900">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-gradient-soft text-brand-300 font-bold text-xs select-none">
              No Preview Available
            </div>
          )}

          {/* overlay link if demoUrl is set */}
          {product.demoUrl && (
            <a
              href={product.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={`Visit ${product.name}`}
            />
          )}

          {/* Badges Overlay */}
          <span className="absolute left-2.5 top-2.5 z-20 rounded-md bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            {displayTag}
          </span>

          <span className="absolute right-2.5 top-2.5 z-20 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1 text-xs font-bold text-slate-800 shadow-sm border border-slate-200">
            Starting ₹{product.price}
          </span>
        </div>
      </div>

      {/* Info details */}
      <div className="mt-4 flex flex-1 flex-col text-left">
        <h3 className="font-display text-sm font-bold text-cloud-100 sm:text-base line-clamp-1 hover:text-brand-400 transition">
          {product.demoUrl ? (
            <a href={product.demoUrl} target="_blank" rel="noopener noreferrer">
              {product.name}
            </a>
          ) : (
            product.name
          )}
        </h3>

        {/* Highlights list */}
        <ul className="mt-3 space-y-2 flex-1">
          {product.features?.map((highlight, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-cloud-400 leading-normal">
              <span className="text-emerald-400 font-bold select-none mt-0.5">•</span>
              <span className="line-clamp-2">{highlight}</span>
            </li>
          ))}
        </ul>

        {/* Action Link Button */}
        {product.demoUrl && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <a
              href={product.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition"
            >
              Live Demo &rarr;
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function DeliveredWebsiteMobileSlider({ products }) {
  if (!products || products.length === 0) return null

  return (
    <div className="flex w-full gap-4 overflow-x-auto pb-6 pt-2 no-scrollbar snap-x snap-mandatory -mx-4 px-4">
      {products.map((p) => (
        <div key={p._id} className="w-[290px] shrink-0 snap-center">
          <DeliveredWebsiteCard product={p} />
        </div>
      ))}
    </div>
  )
}

export default function DeliveredWebsites() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useProducts({
    type: "delivered-website",
    status: "published",
    limit: 100 // Fetch all client items so we can render them all on mobile marquee
  })

  const allItems = data?.items || []
  const itemsPerPage = 6
  const pages = Math.ceil(allItems.length / itemsPerPage)
  
  const startIndex = (page - 1) * itemsPerPage
  const desktopItems = allItems.slice(startIndex, startIndex + itemsPerPage)

  if (!isLoading && allItems.length === 0) return null

  return (
    <section className="container-rs py-12 sm:py-16 scroll-mt-32">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl lg:text-4xl">
          Websites I’ve Built &amp; Delivered
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-xs font-medium text-cloud-400 sm:text-sm md:text-base">
          Professional e-commerce websites with responsive design, fast performance, and seamless shopping experience.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <p className="text-sm text-cloud-500 animate-pulse">Loading delivered websites…</p>
        </div>
      ) : (
        <>
          {/* 1. Desktop & Tablet Grid View */}
          <div className="hidden sm:block">
            <div className="relative">
              <motion.div 
                layout
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                <AnimatePresence mode="popLayout">
                  {desktopItems.map((p, i) => (
                    <motion.div
                      key={p._id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <DeliveredWebsiteCard product={p} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Pagination Controls */}
            {pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30 transition hover:bg-white/5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-cloud-400 select-none">
                  Page {page} of {pages}
                </span>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30 transition hover:bg-white/5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* 2. Mobile View: Manual Touch-scrolling Slider */}
          <div className="block sm:hidden">
            <DeliveredWebsiteMobileSlider products={allItems} />
          </div>
        </>
      )}
    </section>
  )
}
