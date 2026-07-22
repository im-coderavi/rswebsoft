import { useState } from "react"
import { Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { useSubscribers, useDeleteSubscriber } from "../../hooks/useSubscribers"
import { apiErrorMessage } from "../../lib/api"
import DataTable from "../components/DataTable"
import ConfirmDialog from "../components/ConfirmDialog"

export default function SubscriberList() {
  const { data: subscribers, isLoading } = useSubscribers()
  const deleteSubscriber = useDeleteSubscriber()
  const [pendingDelete, setPendingDelete] = useState(null)

  async function confirmDelete() {
    try {
      await deleteSubscriber.mutateAsync(pendingDelete._id)
      toast.success("Subscriber removed")
      setPendingDelete(null)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const columns = [
    { key: "email", label: "Email" },
    { key: "createdAt", label: "Subscribed", render: (s) => new Date(s.createdAt).toLocaleDateString() },
  ]

  return (
    <div>
      <p className="mb-5 text-sm text-cloud-400">
        {subscribers?.length || 0} newsletter subscriber{subscribers?.length === 1 ? "" : "s"}
      </p>

      <DataTable
        columns={columns}
        rows={subscribers || []}
        loading={isLoading}
        emptyMessage="No subscribers yet."
        actions={(s) => (
          <button
            onClick={() => setPendingDelete(s)}
            className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-rose-500/15 hover:text-rose-400"
            aria-label="Remove"
          >
            <Trash2 size={15} />
          </button>
        )}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove subscriber?"
        message={`This will permanently remove "${pendingDelete?.email}" from the newsletter list.`}
        busy={deleteSubscriber.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
