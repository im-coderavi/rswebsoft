import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, ExternalLink, CheckCircle2, Eye, Globe } from "lucide-react"
import { useProducts } from "../../hooks/useProducts"
import { useNavigate } from "react-router-dom"

function DeliveredWebsiteCard({ product }) {
  const navigate = useNavigate()
  const demoUrl = product.demoUrl || (product.slug ? `/products/${product.slug}?preview=true` : "#")
  const isExternal = demoUrl.startsWith("http://") || demoUrl.startsWith("https://")

  // Show max 3-4 points max as requested
  const highlights = (product.features || []).slice(0, 4)

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/90 p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/5">
      
      {/* Browser Window Mockup */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-ink-800 border border-white/5 shadow-inner">
        
        {/* Browser Top Bar */}
        <div className="flex items-center gap-1.5 bg-ink-950/80 px-3 py-2 border-b border-white/5">
          <div className="h-2 w-2 rounded-full bg-rose-500/80" />
          <div className="h-2 w-2 rounded-full bg-amber-500/80" />
          <div className="h-2 w-2 rounded-full bg-emerald-500/80" />
          <div className="ml-2 flex h-4 flex-1 items-center rounded bg-ink-850/60 px-2 text-[9px] text-cloud-400 truncate select-none font-mono">
            {product.demoUrl ? product.demoUrl.replace(/^https?:\/\//, "") : product.name.toLowerCase()}
          </div>
        </div>

        {/* Website Image Preview */}
        <div className="relative h-[calc(100%-24px)] w-full overflow-hidden bg-ink-950">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="h-full w-full object-cover object-top transition-all duration-[3000ms] ease-in-out group-hover:object-bottom"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-gradient-soft text-brand-300 font-bold text-xs select-none">
              <Globe size={18} className="mr-1.5" /> Website Preview
            </div>
          )}

          {/* Clickable Image Overlay */}
          {isExternal ? (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={`Visit ${product.name}`}
            />
          ) : (
            <button
              onClick={() => navigate(demoUrl)}
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={`Visit ${product.name}`}
            />
          )}

          {/* Badges Overlay */}
          {product.displayTag ? (
            <span className="absolute left-2.5 top-2.5 z-20 rounded-md bg-emerald-500/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm pointer-events-none">
              {product.displayTag}
            </span>
          ) : null}

          {product.price && (
            <span className="absolute right-2.5 top-2.5 z-20 rounded-full bg-ink-950/90 backdrop-blur-sm px-2.5 py-0.5 text-xs font-extrabold text-cloud-100 shadow-sm border border-white/10 pointer-events-none">
              Starting ₹{product.price.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>

      {/* Content Details */}
      <div className="mt-4 flex flex-1 flex-col justify-between text-left">
        <div>
          <h3 className="font-display text-base font-bold text-cloud-100 line-clamp-1 group-hover:text-brand-300 transition">
            {isExternal ? (
              <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                {product.name}
              </a>
            ) : (
              product.name
            )}
          </h3>

          {/* 3-4 Highlights Points max */}
          <ul className="mt-3 space-y-2">
            {highlights.map((highlight, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-cloud-300 font-medium leading-tight">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span className="line-clamp-1">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button: ALWAYS View Website */}
        <div className="mt-5 pt-3 border-t border-white/5 relative z-20">
          {isExternal ? (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/20 py-2.5 px-4 text-xs font-bold text-brand-300 transition hover:bg-brand-500/20 hover:text-white cursor-pointer"
            >
              <Eye size={14} /> View Website <ExternalLink size={12} />
            </a>
          ) : (
            <button
              onClick={() => navigate(demoUrl)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/20 py-2.5 px-4 text-xs font-bold text-brand-300 transition hover:bg-brand-500/20 hover:text-white cursor-pointer"
            >
              <Eye size={14} /> View Website <ExternalLink size={12} />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

function DeliveredWebsiteMobileSlider({ products }) {
  if (!products || products.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {products.map((p) => (
        <div key={p._id} className="w-full">
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
    limit: 100
  })

  const allItems = data?.items || []
  const itemsPerPage = 6
  const pages = Math.ceil(allItems.length / itemsPerPage)
  
  const startIndex = (page - 1) * itemsPerPage
  const desktopItems = allItems.slice(startIndex, startIndex + itemsPerPage)

  if (!isLoading && allItems.length === 0) return null

  return (
    <section className="container-rs py-12 sm:py-16 scroll-mt-32">
      <div className="text-center mb-8 sm:mb-12 space-y-2">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl lg:text-4xl">
          Websites I’ve Built &amp; Delivered
        </h2>
        <p className="mx-auto max-w-2xl text-xs sm:text-sm text-cloud-400 font-medium">
          Professional e-commerce websites with responsive design, fast performance, and seamless shopping experience.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Grid */}
          <div className="hidden sm:block">
            <div className="relative">
              <motion.div 
                layout
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                <AnimatePresence mode="popLayout">
                  {desktopItems.map((p, i) => (
                    <motion.div
                      key={p._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
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
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30 transition hover:bg-white/5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-cloud-400 font-medium select-none">
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

          {/* Mobile Grid Layout */}
          <div className="block sm:hidden">
            <DeliveredWebsiteMobileSlider products={desktopItems} />
            {pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-cloud-400 font-medium select-none">
                  Page {page} of {pages}
                </span>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
