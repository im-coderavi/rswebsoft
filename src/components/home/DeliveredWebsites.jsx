import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useProducts } from "../../hooks/useProducts"
import DeliveredWebsiteCard from "./DeliveredWebsiteCard"

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
