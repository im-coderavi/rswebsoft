import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import SectionHeader from "../ui/SectionHeader"
import ProductCard from "./ProductCard"
import { useProducts } from "../../hooks/useProducts"

export default function ReadyWebsites() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useProducts({ type: "ready-website", status: "published", limit: 100 })
  const allItems = data?.items || []

  const itemsPerPage = 8
  const pages = Math.ceil(allItems.length / itemsPerPage)
  
  const startIndex = (page - 1) * itemsPerPage
  const paginatedItems = allItems.slice(startIndex, startIndex + itemsPerPage)

  if (!isLoading && allItems.length === 0) return null

  return (
    <section className="container-rs py-8">
      <SectionHeader title="Ready Websites" to="/products?type=ready-website" />
      {isLoading ? (
        <p className="text-sm text-cloud-500">Loading ready websites…</p>
      ) : (
        <>
          <div className="relative">
            <motion.div 
              layout
              className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {paginatedItems.map((p, i) => (
                  <motion.div
                    key={p._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: (i % 8) * 0.04 }}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>

          {pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30 transition hover:bg-white/5 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Previous Page"
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
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
