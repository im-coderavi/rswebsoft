import { useState } from "react"
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Search, X } from "lucide-react"
import toast from "react-hot-toast"
import {
  useAdminHomeSections,
  useCreateHomeSection,
  useUpdateHomeSection,
  useDeleteHomeSection,
  useReorderHomeSections,
} from "../../../hooks/useHomeSections"
import { useCategories } from "../../../hooks/useCategories"
import { useProducts } from "../../../hooks/useProducts"
import { apiErrorMessage } from "../../../lib/api"
import DataTable from "../../components/DataTable"
import ConfirmDialog from "../../components/ConfirmDialog"

const PRODUCT_TYPES = [
  { value: "any", label: "Any Type" },
  { value: "plugin", label: "Plugin" },
  { value: "theme", label: "Theme" },
  { value: "ready-website", label: "Ready Website" },
  { value: "delivered-website", label: "Delivered Website" },
  { value: "package", label: "Package" },
  { value: "saas", label: "SaaS" },
  { value: "source-code", label: "Source Code" },
  { value: "tool", label: "Tool" },
  { value: "other", label: "Other" },
]

const emptyForm = {
  title: "",
  subtitle: "",
  layout: "grid",
  selectionMode: "auto",
  filters: { category: "", type: "any", onlyFeatured: false },
  manualProducts: [],
  maxItems: 8,
  isActive: true,
}

export default function HomeSectionList() {
  const { data: sections, isLoading } = useAdminHomeSections()
  const { data: categories } = useCategories()
  const createSection = useCreateHomeSection()
  const updateSection = useUpdateHomeSection()
  const deleteSection = useDeleteHomeSection()
  const reorderSections = useReorderHomeSections()

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

  function openEdit(section) {
    setEditing(section)
    setForm({
      title: section.title,
      subtitle: section.subtitle || "",
      layout: section.layout,
      selectionMode: section.selectionMode,
      filters: {
        category: section.filters?.category?._id || section.filters?.category || "",
        type: section.filters?.type || "any",
        onlyFeatured: Boolean(section.filters?.onlyFeatured),
      },
      manualProducts: section.manualProducts || [],
      maxItems: section.maxItems,
      isActive: section.isActive,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      layout: form.layout,
      selectionMode: form.selectionMode,
      maxItems: Number(form.maxItems),
      isActive: form.isActive,
      filters: {
        category: form.filters.category || null,
        type: form.filters.type,
        onlyFeatured: form.filters.onlyFeatured,
      },
      manualProducts: form.manualProducts.map((p) => p._id || p),
    }

    try {
      if (editing) {
        await updateSection.mutateAsync({ id: editing._id, ...payload })
        toast.success("Section updated")
      } else {
        await createSection.mutateAsync(payload)
        toast.success("Section created")
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function confirmDelete() {
    try {
      await deleteSection.mutateAsync(pendingDelete._id)
      toast.success("Section deleted")
      setPendingDelete(null)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function move(section, direction) {
    const ordered = [...(sections || [])].sort((a, b) => a.order - b.order)
    const index = ordered.findIndex((s) => s._id === section._id)
    const swapWith = direction === "up" ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= ordered.length) return

    const ids = ordered.map((s) => s._id)
    ;[ids[index], ids[swapWith]] = [ids[swapWith], ids[index]]

    try {
      await reorderSections.mutateAsync(ids)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function toggleActive(section) {
    try {
      await updateSection.mutateAsync({ id: section._id, isActive: !section.isActive })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  function addManualProduct(product) {
    if (form.manualProducts.some((p) => (p._id || p) === product._id)) return
    setForm((f) => ({ ...f, manualProducts: [...f.manualProducts, product] }))
  }

  function removeManualProduct(productId) {
    setForm((f) => ({ ...f, manualProducts: f.manualProducts.filter((p) => (p._id || p) !== productId) }))
  }

  function moveManualProduct(index, direction) {
    setForm((f) => {
      const list = [...f.manualProducts]
      const swapWith = direction === "up" ? index - 1 : index + 1
      if (swapWith < 0 || swapWith >= list.length) return f
      ;[list[index], list[swapWith]] = [list[swapWith], list[index]]
      return { ...f, manualProducts: list }
    })
  }

  const saving = createSection.isPending || updateSection.isPending
  const ordered = [...(sections || [])].sort((a, b) => a.order - b.order)

  const columns = [
    { key: "title", label: "Section", render: (s) => <span className="font-medium text-cloud-100">{s.title}</span> },
    { key: "layout", label: "Layout" },
    { key: "selectionMode", label: "Mode", render: (s) => (s.selectionMode === "manual" ? "Manual" : "Auto") },
    { key: "productCount", label: "Products" },
    {
      key: "isActive",
      label: "Active",
      render: (s) => (
        <button
          onClick={() => toggleActive(s)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            s.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-cloud-500"
          }`}
        >
          {s.isActive ? "Active" : "Hidden"}
        </button>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
        >
          <Plus size={16} /> New Section
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={ordered}
        loading={isLoading}
        emptyMessage="No homepage sections yet."
        actions={(s) => (
          <>
            <button
              onClick={() => move(s, "up")}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100"
              aria-label="Move up"
            >
              <ArrowUp size={15} />
            </button>
            <button
              onClick={() => move(s, "down")}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100"
              aria-label="Move down"
            >
              <ArrowDown size={15} />
            </button>
            <button
              onClick={() => openEdit(s)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100"
              aria-label="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setPendingDelete(s)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-rose-500/15 hover:text-rose-400"
              aria-label="Delete"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4" onClick={() => setModalOpen(false)}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-ink-850 p-6"
          >
            <h2 className="font-display text-base font-bold text-cloud-100">
              {editing ? "Edit Section" : "New Section"}
            </h2>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Subtitle (optional)</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">Layout</label>
                <select
                  value={form.layout}
                  onChange={(e) => setForm((f) => ({ ...f, layout: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                >
                  <option value="grid">Grid</option>
                  <option value="carousel">Carousel</option>
                  <option value="showcase">Showcase (website preview cards)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">Max items</label>
                <input
                  type="number"
                  min={1}
                  max={48}
                  value={form.maxItems}
                  onChange={(e) => setForm((f) => ({ ...f, maxItems: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">How should products be picked?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, selectionMode: "auto" }))}
                  className={`flex-1 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                    form.selectionMode === "auto"
                      ? "border-brand-500/60 bg-brand-500/10 text-brand-200"
                      : "border-white/10 text-cloud-400 hover:bg-white/5"
                  }`}
                >
                  Auto-filter
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, selectionMode: "manual" }))}
                  className={`flex-1 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                    form.selectionMode === "manual"
                      ? "border-brand-500/60 bg-brand-500/10 text-brand-200"
                      : "border-white/10 text-cloud-400 hover:bg-white/5"
                  }`}
                >
                  Manually pick products
                </button>
              </div>
            </div>

            {form.selectionMode === "auto" ? (
              <div className="space-y-3 rounded-xl border border-white/10 p-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-cloud-400">Category</label>
                  <select
                    value={form.filters.category}
                    onChange={(e) => setForm((f) => ({ ...f, filters: { ...f.filters, category: e.target.value } }))}
                    className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {(categories || []).map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-cloud-400">Product Type</label>
                  <select
                    value={form.filters.type}
                    onChange={(e) => setForm((f) => ({ ...f, filters: { ...f.filters, type: e.target.value } }))}
                    className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                  >
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-cloud-300">
                  <input
                    type="checkbox"
                    checked={form.filters.onlyFeatured}
                    onChange={(e) => setForm((f) => ({ ...f, filters: { ...f.filters, onlyFeatured: e.target.checked } }))}
                    className="h-4 w-4 rounded border-white/20 bg-ink-800"
                  />
                  Only show featured products
                </label>
              </div>
            ) : (
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
                        onClick={() => addManualProduct(p)}
                        className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm text-cloud-200 hover:bg-white/5"
                      >
                        {p.name}
                        <Plus size={14} />
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  {form.manualProducts.map((p, i) => (
                    <div key={p._id || p} className="flex items-center justify-between rounded-lg bg-ink-800 px-3 py-2 text-sm text-cloud-200">
                      <span className="truncate">{p.name || p}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveManualProduct(i, "up")} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-white/5">
                          <ArrowUp size={13} />
                        </button>
                        <button type="button" onClick={() => moveManualProduct(i, "down")} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-white/5">
                          <ArrowDown size={13} />
                        </button>
                        <button type="button" onClick={() => removeManualProduct(p._id || p)} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-rose-500/15 hover:text-rose-400">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {form.manualProducts.length === 0 && (
                    <p className="text-xs text-cloud-500">No products added yet. Search above to add some.</p>
                  )}
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-cloud-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-ink-800"
              />
              Show this section on the homepage
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
        title="Delete section?"
        message={`This will permanently delete "${pendingDelete?.title}" from the homepage.`}
        busy={deleteSection.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
