import { useState } from "react"
import { Flame, ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import ProductCard from "./ProductCard"
import { useProducts } from "../../hooks/useProducts"
import Reveal from "../ui/Reveal"

export default function FeaturedProducts() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useProducts({ featured: true, status: "published", limit: 100 })
  const allItems = data?.items || []

  const itemsPerPage = 8
  const pages = Math.ceil(allItems.length / itemsPerPage)
  
  const startIndex = (page - 1) * itemsPerPage
  const paginatedItems = allItems.slice(startIndex, startIndex + itemsPerPage)

  if (!isLoading && allItems.length === 0) return null

  return (
    <section className="container-rs py-8">
      <Reveal className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-brand-gradient-soft p-4 sm:p-8">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand-600/20 blur-3xl" />
        
        <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
              <Flame size={20} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-cloud-100">
                Featured Products
              </h2>
              <p className="mt-0.5 text-sm text-cloud-400">Hand-picked, top-rated across every category</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/products?featured=true" className="text-sm font-medium text-brand-300 hover:text-brand-200">
              View All →
            </Link>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-cloud-500">Loading featured products…</p>
        ) : (
          <>
            <div className="relative">
              <motion.div 
                layout
                className="relative grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4"
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
              <div className="relative z-10 mt-8 flex items-center justify-center gap-3">
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
      </Reveal>
    </section>
  )
}
