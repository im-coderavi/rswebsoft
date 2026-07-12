import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "../../../hooks/useBrands"
import { apiErrorMessage } from "../../../lib/api"
import { toneGradient, TONE_KEYS } from "../../../lib/tones"
import Icon from "../../../components/ui/Icon"
import DataTable from "../../components/DataTable"
import ConfirmDialog from "../../components/ConfirmDialog"
import ImageUploader from "../../components/ImageUploader"

const emptyForm = { name: "", tag: "", icon: "Building2", tone: "violet", website: "", logo: null }

export default function BrandList() {
  const { data: brands, isLoading } = useBrands()
  const createBrand = useCreateBrand()
  const updateBrand = useUpdateBrand()
  const deleteBrand = useDeleteBrand()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [pendingDelete, setPendingDelete] = useState(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(brand) {
    setEditing(brand)
    setForm({
      name: brand.name,
      tag: brand.tag,
      icon: brand.icon,
      tone: brand.tone,
      website: brand.website,
      logo: brand.logo?.url ? brand.logo : null,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editing) {
        await updateBrand.mutateAsync({ id: editing._id, ...form })
        toast.success("Brand updated")
      } else {
        await createBrand.mutateAsync(form)
        toast.success("Brand created")
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function confirmDelete() {
    try {
      await deleteBrand.mutateAsync(pendingDelete._id)
      toast.success("Brand deleted")
      setPendingDelete(null)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const saving = createBrand.isPending || updateBrand.isPending

  const columns = [
    {
      key: "name",
      label: "Brand",
      render: (b) => (
        <div className="flex items-center gap-3">
          {b.logo?.url ? (
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-ink-800">
              <img src={b.logo.url} alt="" className="h-full w-full object-contain p-1" />
            </span>
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-lg text-white" style={toneGradient(b.tone)}>
              <Icon name={b.icon} size={16} />
            </span>
          )}
          <div>
            <div className="font-medium text-cloud-100">{b.name}</div>
            <div className="text-xs text-cloud-500">{b.tag}</div>
          </div>
        </div>
      ),
    },
    {
      key: "website",
      label: "Website",
      render: (b) =>
        b.website ? (
          <a href={b.website} target="_blank" rel="noreferrer" className="text-brand-300 hover:underline">
            {b.website}
          </a>
        ) : (
          "—"
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
          <Plus size={16} /> New Brand
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={brands || []}
        loading={isLoading}
        emptyMessage="No brands yet."
        actions={(b) => (
          <>
            <button
              onClick={() => openEdit(b)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100"
              aria-label="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setPendingDelete(b)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-rose-500/15 hover:text-rose-400"
              aria-label="Delete"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setModalOpen(false)}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-ink-850 p-6"
          >
            <h2 className="font-display text-base font-bold text-cloud-100">
              {editing ? "Edit Brand" : "New Brand"}
            </h2>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Tag line</label>
              <input
                value={form.tag}
                onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
                placeholder="e.g. WordPress Products"
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                Brand link <span className="text-cloud-500">(website — used when this brand's card is clicked)</span>
              </label>
              <input
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://…"
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                Logo <span className="text-cloud-500">(optional — falls back to icon below)</span>
              </label>
              <ImageUploader
                images={form.logo ? [form.logo] : []}
                onChange={(imgs) => setForm((f) => ({ ...f, logo: imgs[imgs.length - 1] || null }))}
                max={1}
                folder="brands"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                Icon name <span className="text-cloud-500">(lucide-react name, used when no logo is set)</span>
              </label>
              <input
                required
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Color</label>
              <div className="flex flex-wrap gap-2">
                {TONE_KEYS.map((tone) => (
                  <button
                    type="button"
                    key={tone}
                    onClick={() => setForm((f) => ({ ...f, tone }))}
                    className={`h-7 w-7 rounded-full transition ${form.tone === tone ? "ring-2 ring-white ring-offset-2 ring-offset-ink-850" : ""}`}
                    style={toneGradient(tone)}
                    aria-label={tone}
                  />
                ))}
              </div>
            </div>
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
        title="Delete brand?"
        message={`This will permanently delete "${pendingDelete?.name}". Brands with products can't be deleted.`}
        busy={deleteBrand.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
