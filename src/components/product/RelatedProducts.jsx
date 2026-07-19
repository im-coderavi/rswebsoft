import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Layers } from "lucide-react"
import ProductCard from "../home/ProductCard"
import { useProducts } from "../../hooks/useProducts"

const PAGE_SIZE = 3

export default function RelatedProducts({ categoryId, excludeId }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useProducts({
    category: categoryId,
    status: "published",
    limit: PAGE_SIZE + 1,
    page,
  })

  const products = (data?.items || []).filter((p) => p._id !== excludeId).slice(0, PAGE_SIZE)

  if (!isLoading && products.length === 0) return null

  function goToPage(p) {
    setPage(p)
    window.scrollTo({ top: document.getElementById("related-products")?.offsetTop - 80 || 0, behavior: "smooth" })
  }

  return (
    <div id="related-products" className="mt-12 scroll-mt-24">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient-soft text-brand-300">
          <Layers size={18} />
        </span>
        <h2 className="font-display text-xl font-bold text-cloud-100">Related Products</h2>
      </div>

      {isLoading ? (
        <p className="text-sm text-cloud-500">Loading related products…</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30 cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs text-cloud-400 font-medium">Page {data.page} of {data.pages}</span>
          <button
            disabled={page >= data.pages}
            onClick={() => goToPage(page + 1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30 cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
