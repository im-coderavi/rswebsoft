import { useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, ChevronLeft, ChevronRight, PackageSearch } from "lucide-react"
import ProductCard from "../components/home/ProductCard"
import { useProducts } from "../hooks/useProducts"
import { useCategories } from "../hooks/useCategories"

const TYPES = [
  { value: "", label: "All Types" },
  { value: "plugin", label: "Plugins" },
  { value: "theme", label: "Themes" },
  { value: "ready-website", label: "Ready Websites" },
  { value: "delivered-website", label: "Delivered Websites" },
  { value: "package", label: "Development Packages" },
  { value: "saas", label: "SaaS Software" },
  { value: "source-code", label: "Source Codes" },
  { value: "other", label: "Other" },
]

export default function ProductsListing() {
  const [params, setParams] = useSearchParams()
  const search = params.get("search") || ""
  const category = params.get("category") || ""
  const brand = params.get("brand") || ""
  const type = params.get("type") || ""
  const featured = params.get("featured") || ""
  const page = Number(params.get("page")) || 1

  const { data: categories } = useCategories()
  const { data, isLoading } = useProducts({
    status: "published",
    search: search || undefined,
    category: category || undefined,
    brand: brand || undefined,
    type: type || undefined,
    featured: featured || undefined,
    page,
    limit: 12,
  })

  function updateParam(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete("page")
    setParams(next)
  }

  function goToPage(p) {
    const next = new URLSearchParams(params)
    next.set("page", String(p))
    setParams(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const products = data?.items || []

  return (
    <section className="container-rs py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-cloud-100">All Products</h1>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-ink-850 px-3 py-2.5">
          <Search size={16} className="text-cloud-500" />
          <input
            defaultValue={search}
            onKeyDown={(e) => e.key === "Enter" && updateParam("search", e.currentTarget.value)}
            onBlur={(e) => updateParam("search", e.currentTarget.value)}
            placeholder="Search products…"
            className="w-56 bg-transparent text-sm text-cloud-100 placeholder:text-cloud-500 focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => updateParam("category", e.target.value)}
          className="rounded-lg border border-white/10 bg-ink-850 px-3 py-2.5 text-sm text-cloud-200 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories?.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => updateParam("type", e.target.value)}
          className="rounded-lg border border-white/10 bg-ink-850 px-3 py-2.5 text-sm text-cloud-200 focus:outline-none"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-cloud-500">Loading products…</p>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <PackageSearch size={40} className="text-cloud-600" />
          <p className="text-cloud-400">No products found. Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3">
          {products.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: (i % 12) * 0.04, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-cloud-400">Page {data.page} of {data.pages}</span>
          <button
            disabled={page >= data.pages}
            onClick={() => goToPage(page + 1)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </section>
  )
}
