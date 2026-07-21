import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import toast from "react-hot-toast"
import { useProducts, useDeleteProduct } from "../../../hooks/useProducts"
import { useCategories } from "../../../hooks/useCategories"
import { apiErrorMessage } from "../../../lib/api"
import { formatINR } from "../../../lib/currency"
import DataTable from "../../components/DataTable"
import ConfirmDialog from "../../components/ConfirmDialog"

const STATUS_STYLES = {
  published: "bg-emerald-500/15 text-emerald-400",
  draft: "bg-amber-500/15 text-amber-400",
}

export default function ProductList() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState(null)

  const { data, isLoading } = useProducts({ search: search || undefined, category: category || undefined, status: status || undefined, page, limit: 10 })
  const { data: categories } = useCategories()
  const deleteProduct = useDeleteProduct()

  async function confirmDelete() {
    try {
      await deleteProduct.mutateAsync(pendingDelete._id)
      toast.success("Product deleted")
      setPendingDelete(null)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const columns = [
    {
      key: "name",
      label: "Product",
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0] ? (
            <img src={p.images[0].url} alt="" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink-700 text-xs text-cloud-500">—</span>
          )}
          <div className="min-w-0">
            <div className="max-w-[220px] truncate font-medium text-cloud-100">{p.name}</div>
            <div className="text-xs text-cloud-500">{p.type}</div>
          </div>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (p) => p.category?.name || "—" },
    {
      key: "price",
      label: "Price",
      render: (p) => (
        <span>
          {formatINR(p.salePrice ?? p.price)}
          {p.salePrice != null && (
            <span className="ml-1.5 text-xs text-cloud-500 line-through">{formatINR(p.price)}</span>
          )}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (p) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[p.status]}`}>
          {p.status}
        </span>
      ),
    },
    { 
      key: "rating", 
      label: "Rating", 
      render: (p) => {
        const r = typeof p.rating === "number" ? p.rating : parseFloat(p.rating)
        const formatted = !isNaN(r) ? r.toFixed(1) : "5.0"
        return `${formatted} (${p.numReviews ?? 0})`
      } 
    },
  ]

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-ink-850 px-3 py-2">
            <Search size={15} className="text-cloud-500" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              placeholder="Search products…"
              className="w-48 bg-transparent text-sm text-cloud-100 placeholder:text-cloud-500 focus:outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              setPage(1)
              setCategory(e.target.value)
            }}
            className="rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-sm text-cloud-200 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className="rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-sm text-cloud-200 focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
        >
          <Plus size={16} /> New Product
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items || []}
        loading={isLoading}
        emptyMessage="No products yet — create your first one."
        actions={(p) => (
          <>
            <Link
              to={`/admin/products/${p._id}/edit`}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100"
              aria-label="Edit"
            >
              <Pencil size={15} />
            </Link>
            <button
              onClick={() => setPendingDelete(p)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-rose-500/15 hover:text-rose-400"
              aria-label="Delete"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-cloud-400">Page {data.page} of {data.pages}</span>
          <button
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete product?"
        message={`This will permanently delete "${pendingDelete?.name}".`}
        busy={deleteProduct.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
