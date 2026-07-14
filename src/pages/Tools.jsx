import { useSearchParams, Link } from "react-router-dom"
import { Wrench, FolderOpen, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { useProducts } from "../hooks/useProducts"
import ProductCard from "../components/home/ProductCard"
import Reveal, { RevealGroup, RevealItem } from "../components/ui/Reveal"

const PAGE_LIMIT = 8 // 8 products per page

export default function Tools() {
  const [params, setParams] = useSearchParams()
  const page = Number(params.get("page")) || 1

  const { data, isLoading } = useProducts({
    type: "tool",
    status: "published",
    page,
    limit: PAGE_LIMIT,
  })

  const products = data?.items || []

  function goToPage(p) {
    const next = new URLSearchParams(params)
    next.set("page", String(p))
    setParams(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="container-rs py-10 sm:py-14">
      {/* Header Section */}
      <Reveal className="mb-10">
        <div className="flex items-center gap-2.5 text-xs font-semibold text-brand-400">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/10 text-brand-400">
            <Wrench size={14} />
          </span>
          Digital Tool Selling Hub
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-cloud-100 sm:text-3xl lg:text-4xl">
          Web Tools &amp; SaaS Utilities
        </h1>
        <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-cloud-400 sm:text-base">
          Power up your web projects with premium self-hosted developer utilities, SEO crawlers, and AI tools. Set up your own SaaS portal or sell licenses directly from one unified console.
        </p>
      </Reveal>

      {/* Dynamic Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[360px] animate-pulse rounded-2xl bg-ink-850" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {products.map((p, i) => (
              <RevealItem key={p._id}>
                <ProductCard product={p} />
              </RevealItem>
            ))}
          </RevealGroup>

          {/* Pagination Controls */}
          {data && data.pages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3 border-t border-white/5 pt-8">
              <button
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-ink-850 text-cloud-300 transition hover:bg-ink-800 hover:text-cloud-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                aria-label="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-semibold text-cloud-400">
                Page {data.page} of {data.pages}
              </span>
              <button
                disabled={page >= data.pages}
                onClick={() => goToPage(page + 1)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-ink-850 text-cloud-300 transition hover:bg-ink-800 hover:text-cloud-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                aria-label="Next Page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient-soft text-brand-300">
            <FolderOpen size={30} />
          </span>
          <h3 className="text-base font-bold text-cloud-100 sm:text-lg">No tools added yet</h3>
          <p className="mt-1 text-sm text-cloud-400 max-w-sm">
            Check back later or log in to the admin panel to upload your first digital tool product dynamically.
          </p>
          <Link
            to="/admin/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Go to Admin Panel <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}
