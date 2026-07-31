import { useState } from "react"
import { Plus, Pencil, Trash2, Search, X } from "lucide-react"
import toast from "react-hot-toast"
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from "../../../hooks/useCoupons"
import { useProducts } from "../../../hooks/useProducts"
import { apiErrorMessage } from "../../../lib/api"
import DataTable from "../../components/DataTable"
import ConfirmDialog from "../../components/ConfirmDialog"

const emptyForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  appliesTo: "all",
  products: [],
  expiresAt: "",
  usageLimit: "",
  perCustomerLimit: false,
  minOrderValue: "",
  status: "active",
}

export default function CouponList() {
  const { data: coupons, isLoading } = useCoupons()
  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon()
  const deleteCoupon = useDeleteCoupon()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [productQuery, setProductQuery] = useState("")

  const { data: searchResults } = useProducts({ search: productQuery, limit: 10 })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(coupon) {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      appliesTo: coupon.appliesTo,
      products: coupon.products || [],
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
      usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
      perCustomerLimit: Boolean(coupon.perCustomerLimit),
      minOrderValue: coupon.minOrderValue != null ? String(coupon.minOrderValue) : "",
      status: coupon.status,
    })
    setModalOpen(true)
  }

  function addProduct(product) {
    if (form.products.some((p) => (p._id || p) === product._id)) return
    setForm((f) => ({ ...f, products: [...f.products, product] }))
    setProductQuery("")
  }

  function removeProduct(productId) {
    setForm((f) => ({ ...f, products: f.products.filter((p) => (p._id || p) !== productId) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      appliesTo: form.appliesTo,
      products: form.appliesTo === "products" ? form.products.map((p) => p._id || p) : [],
      expiresAt: form.expiresAt || null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perCustomerLimit: form.perCustomerLimit,
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
      status: form.status,
    }
    try {
      if (editing) {
        await updateCoupon.mutateAsync({ id: editing._id, ...payload })
        toast.success("Coupon updated")
      } else {
        await createCoupon.mutateAsync(payload)
        toast.success("Coupon created")
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function confirmDelete() {
    try {
      await deleteCoupon.mutateAsync(pendingDelete._id)
      toast.success("Coupon deleted")
      setPendingDelete(null)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const saving = createCoupon.isPending || updateCoupon.isPending

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (c) => <span className="font-mono font-semibold text-cloud-100">{c.code}</span>,
    },
    {
      key: "discount",
      label: "Discount",
      render: (c) => (c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`),
    },
    {
      key: "appliesTo",
      label: "Scope",
      render: (c) =>
        c.appliesTo === "all"
          ? "All Products"
          : `${c.products?.length || 0} Product${c.products?.length === 1 ? "" : "s"}`,
    },
    {
      key: "usage",
      label: "Used",
      render: (c) => (c.usageLimit != null ? `${c.usedCount} / ${c.usageLimit}` : `${c.usedCount}`),
    },
    {
      key: "status",
      label: "Status",
      render: (c) => {
        const expired = c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()
        const label = expired ? "Expired" : c.status === "active" ? "Active" : "Inactive"
        const style = expired
          ? "bg-rose-500/15 text-rose-400"
          : c.status === "active"
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-ink-700 text-cloud-400"
        return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>{label}</span>
      },
    },
    {
      key: "expiresAt",
      label: "Expires",
      render: (c) => (c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"),
    },
  ]

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
        >
          <Plus size={16} /> New Coupon
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={coupons || []}
        loading={isLoading}
        emptyMessage="No coupons yet."
        actions={(c) => (
          <>
            <button
              onClick={() => openEdit(c)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100"
              aria-label="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setPendingDelete(c)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-rose-500/15 hover:text-rose-400"
              aria-label="Delete"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto" onClick={() => setModalOpen(false)}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-ink-850 p-6 my-8"
          >
            <h2 className="font-display text-base font-bold text-cloud-100">
              {editing ? "Edit Coupon" : "New Coupon"}
            </h2>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Coupon Code</label>
              <input
                required
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. WELCOME10"
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm font-mono text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">Discount Type</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                  {form.discountType === "percentage" ? "Percent Off" : "Amount Off (₹)"}
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  max={form.discountType === "percentage" ? "100" : undefined}
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Applies To</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-cloud-300">
                  <input
                    type="radio"
                    checked={form.appliesTo === "all"}
                    onChange={() => setForm((f) => ({ ...f, appliesTo: "all" }))}
                    className="h-4 w-4 border-white/20 bg-ink-800"
                  />
                  All Products
                </label>
                <label className="flex items-center gap-2 text-sm text-cloud-300">
                  <input
                    type="radio"
                    checked={form.appliesTo === "products"}
                    onChange={() => setForm((f) => ({ ...f, appliesTo: "products" }))}
                    className="h-4 w-4 border-white/20 bg-ink-800"
                  />
                  Specific Products
                </label>
              </div>
            </div>

            {form.appliesTo === "products" && (
              <div className="space-y-3 rounded-xl border border-white/10 p-3.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cloud-500" />
                  <input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Search products to add…"
                    className="w-full rounded-lg border border-white/10 bg-ink-800 py-2.5 pl-9 pr-3.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                  />
                </div>
                {productQuery && (
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/10 p-1.5">
                    {(searchResults?.items || []).map((p) => (
                      <button
                        type="button"
                        key={p._id}
                        onClick={() => addProduct(p)}
                        className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm text-cloud-200 hover:bg-white/5"
                      >
                        {p.name}
                        <Plus size={14} />
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-1.5">
                  {form.products.map((p) => (
                    <div key={p._id || p} className="flex items-center justify-between rounded-lg bg-ink-800 px-3 py-2 text-sm text-cloud-200">
                      <span className="truncate">{p.name || p}</span>
                      <button type="button" onClick={() => removeProduct(p._id || p)} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-rose-500/15 hover:text-rose-400">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  {form.products.length === 0 && (
                    <p className="text-xs text-cloud-500">No products added yet. Search above to add some.</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                  Expiry Date <span className="text-cloud-500">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                  Usage Limit <span className="text-cloud-500">(optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                  placeholder="Unlimited"
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                Minimum Order Value (₹) <span className="text-cloud-500">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.minOrderValue}
                onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))}
                placeholder="No minimum"
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-cloud-300">
              <input
                type="checkbox"
                checked={form.perCustomerLimit}
                onChange={(e) => setForm((f) => ({ ...f, perCustomerLimit: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-ink-800"
              />
              Limit to one use per customer
            </label>

            <label className="flex items-center gap-2 text-sm text-cloud-300">
              <input
                type="checkbox"
                checked={form.status === "active"}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? "active" : "inactive" }))}
                className="h-4 w-4 rounded border-white/20 bg-ink-800"
              />
              Active
            </label>

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-cloud-300 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete coupon?"
        message={`This will permanently delete "${pendingDelete?.code}".`}
        busy={deleteCoupon.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
