import { useState } from "react"
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react"
import toast from "react-hot-toast"
import {
  useDemoLinks,
  useCreateDemoLink,
  useUpdateDemoLink,
  useDeleteDemoLink,
} from "../../../hooks/useDemoLinks"
import { apiErrorMessage } from "../../../lib/api"
import Icon from "../../../components/ui/Icon"
import DataTable from "../../components/DataTable"
import ConfirmDialog from "../../components/ConfirmDialog"

const emptyForm = { title: "", subtitle: "", icon: "Monitor", url: "", order: 0 }

export default function DemoLinkList() {
  const { data: links, isLoading } = useDemoLinks()
  const createLink = useCreateDemoLink()
  const updateLink = useUpdateDemoLink()
  const deleteLink = useDeleteDemoLink()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [pendingDelete, setPendingDelete] = useState(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(link) {
    setEditing(link)
    setForm({
      title: link.title,
      subtitle: link.subtitle || "",
      icon: link.icon,
      url: link.url,
      order: link.order || 0,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const payload = { ...form, order: Number(form.order) || 0 }
      if (editing) {
        await updateLink.mutateAsync({ id: editing._id, ...payload })
        toast.success("Demo link updated")
      } else {
        await createLink.mutateAsync(payload)
        toast.success("Demo link created")
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function confirmDelete() {
    try {
      await deleteLink.mutateAsync(pendingDelete._id)
      toast.success("Demo link deleted")
      setPendingDelete(null)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const saving = createLink.isPending || updateLink.isPending

  const columns = [
    {
      key: "title",
      label: "Card",
      render: (l) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient-soft text-brand-300">
            <Icon name={l.icon} size={16} />
          </span>
          <div>
            <div className="font-medium text-cloud-100">{l.title}</div>
            <div className="text-xs text-cloud-500">{l.subtitle}</div>
          </div>
        </div>
      ),
    },
    {
      key: "url",
      label: "Link",
      render: (l) => (
        <a
          href={l.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-brand-300 hover:underline"
        >
          {l.url} <ExternalLink size={12} />
        </a>
      ),
    },
    { key: "order", label: "Order" },
  ]

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
        >
          <Plus size={16} /> New Demo Link
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={links || []}
        loading={isLoading}
        emptyMessage="No demo links yet — the Demo Center section stays hidden on the homepage until you add some."
        actions={(l) => (
          <>
            <button
              onClick={() => openEdit(l)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100"
              aria-label="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setPendingDelete(l)}
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
              {editing ? "Edit Demo Link" : "New Demo Link"}
            </h2>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Frontend Demos"
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Subtitle</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="e.g. Live website preview"
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                Link <span className="text-cloud-500">(where this card sends visitors)</span>
              </label>
              <input
                required
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://…"
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                Icon name <span className="text-cloud-500">(lucide-react name)</span>
              </label>
              <input
                required
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="e.g. Monitor"
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                Order <span className="text-cloud-500">(lower shows first)</span>
              </label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
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
        title="Delete demo link?"
        message={`This will permanently delete "${pendingDelete?.title}".`}
        busy={deleteLink.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
