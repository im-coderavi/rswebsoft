import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../../../hooks/useCategories"
import { apiErrorMessage } from "../../../lib/api"
import { toneGradient, TONE_KEYS } from "../../../lib/tones"
import Icon from "../../../components/ui/Icon"
import DataTable from "../../components/DataTable"
import ConfirmDialog from "../../components/ConfirmDialog"
import ImageUploader from "../../components/ImageUploader"
import PageHeader from "../../components/PageHeader"
import Button from "../../components/Button"

const emptyForm = { name: "", icon: "Box", tone: "violet", image: null }

export default function CategoryList() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [pendingDelete, setPendingDelete] = useState(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(category) {
    setEditing(category)
    setForm({
      name: category.name,
      icon: category.icon,
      tone: category.tone,
      image: category.image?.url ? category.image : null,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing._id, ...form })
        toast.success("Category updated")
      } else {
        await createCategory.mutateAsync(form)
        toast.success("Category created")
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function confirmDelete() {
    try {
      await deleteCategory.mutateAsync(pendingDelete._id)
      toast.success("Category deleted")
      setPendingDelete(null)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const saving = createCategory.isPending || updateCategory.isPending

  const columns = [
    {
      key: "name",
      label: "Category",
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.image?.url ? (
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-ink-800">
              <img src={c.image.url} alt="" className="h-full w-full object-cover" />
            </span>
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-lg text-white" style={toneGradient(c.tone)}>
              <Icon name={c.icon} size={16} />
            </span>
          )}
          <span className="font-medium text-cloud-100">{c.name}</span>
        </div>
      ),
    },
    { key: "slug", label: "Slug" },
    { key: "productCount", label: "Products", sortable: true },
  ]

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your catalog into browsable categories."
        action={{ label: "New Category", icon: Plus, onClick: openCreate }}
      />

      <DataTable
        columns={columns}
        rows={categories || []}
        loading={isLoading}
        emptyMessage="No categories yet."
        searchable
        searchKeys={["name", "slug"]}
        actions={(c) => (
          <>
            <Button variant="ghost" iconOnly icon={Pencil} onClick={() => openEdit(c)} aria-label="Edit" />
            <Button variant="danger" iconOnly icon={Trash2} onClick={() => setPendingDelete(c)} aria-label="Delete" />
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
              {editing ? "Edit Category" : "New Category"}
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
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                Image <span className="text-cloud-500">(optional — falls back to the icon below)</span>
              </label>
              <ImageUploader
                images={form.image ? [form.image] : []}
                onChange={(imgs) => setForm((f) => ({ ...f, image: imgs[imgs.length - 1] || null }))}
                max={1}
                folder="categories"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                Icon name <span className="text-cloud-500">(lucide-react name, used when no image is set)</span>
              </label>
              <input
                required
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="e.g. Code2"
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
        title="Delete category?"
        message={`This will permanently delete "${pendingDelete?.name}". Categories with products can't be deleted.`}
        busy={deleteCategory.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
