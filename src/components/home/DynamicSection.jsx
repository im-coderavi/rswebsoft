import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import SectionHeader from "../ui/SectionHeader"
import ProductCard from "./ProductCard"
import DeliveredWebsiteCard from "./DeliveredWebsiteCard"
import ProductCarousel from "./ProductCarousel"

function sectionLink(section) {
  return section.ctaLink || "/products"
}

function PaginatedGrid({ section, itemsPerPage, CardComponent, gridClass }) {
  const [page, setPage] = useState(1)
  const products = section.products || []
  const pages = Math.ceil(products.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const paginatedItems = products.slice(startIndex, startIndex + itemsPerPage)

  return (
    <section className="container-rs py-8">
      <SectionHeader title={section.title} to={sectionLink(section)} />
      {section.subtitle && (
        <p className="-mt-4 mb-6 max-w-2xl text-sm text-cloud-400">{section.subtitle}</p>
      )}
      <div className="relative">
        <motion.div layout className={gridClass}>
          <AnimatePresence mode="popLayout">
            {paginatedItems.map((p, i) => (
              <motion.div
                key={p._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: (i % itemsPerPage) * 0.04 }}
              >
                <CardComponent product={p} />
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
    </section>
  )
}

export default function DynamicSection({ section }) {
  const products = section.products || []
  if (products.length === 0) return null

  if (section.layout === "carousel") {
    return <ProductCarousel title={section.title} to={sectionLink(section)} products={products} />
  }

  if (section.layout === "showcase") {
    return (
      <PaginatedGrid
        section={section}
        itemsPerPage={6}
        CardComponent={DeliveredWebsiteCard}
        gridClass="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      />
    )
  }

  return (
    <PaginatedGrid
      section={section}
      itemsPerPage={8}
      CardComponent={ProductCard}
      gridClass="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4"
    />
  )
}
