import { useState } from "react"
import { Link } from "react-router-dom"
import { ShieldAlert, Undo2, Clock } from "lucide-react"
import toast from "react-hot-toast"
import { useLicences, useSetLicenceStatus } from "../../../hooks/useLicences"
import { apiErrorMessage } from "../../../lib/api"
import DataTable from "../../components/DataTable"
import PageHeader from "../../components/PageHeader"
import ConfirmDialog from "../../components/ConfirmDialog"

// Distinct addresses beyond which a licence is worth a look. Mirrors
// SHARING_HINT_IP_COUNT on the server.
//
// This is a hint, never proof. Indian mobile carriers rotate addresses
// constantly, so an honest customer on 4G can cross this in a day without
// doing anything wrong. Read the licence's access log before revoking.
const SHARING_HINT_IP_COUNT = 5

export default function LicenceList() {
  const { data: licences, isLoading } = useLicences()
  const setStatus = useSetLicenceStatus()
  const [pendingRevoke, setPendingRevoke] = useState(null)

  async function confirmRevoke() {
    try {
      await setStatus.mutateAsync({ id: pendingRevoke.id, status: "revoked", reason: "Shared without permission" })
      toast.success("Licence revoked — the download stops working immediately")
      setPendingRevoke(null)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function restore(licence) {
    try {
      await setStatus.mutateAsync({ id: licence.id, status: "active" })
      toast.success("Licence restored")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const columns = [
    {
      key: "key",
      label: "Licence",
      cellClassName: "max-w-0 w-full",
      render: (l) => (
        <div className="min-w-0">
          <div className="font-mono text-xs tracking-wide text-cloud-100">{l.key}</div>
          <div className="truncate text-xs text-cloud-500" title={l.productName}>
            {l.productName}
          </div>
        </div>
      ),
    },
    {
      key: "user",
      label: "Customer",
      render: (l) =>
        l.user ? (
          <Link to={`/admin/customers/${l.user._id}`} className="min-w-0 block">
            <div className="truncate text-sm text-cloud-200 hover:underline">{l.user.name}</div>
            <div className="truncate text-xs text-cloud-500">{l.user.userId || l.user.email}</div>
          </Link>
        ) : (
          <span className="text-cloud-500">—</span>
        ),
    },
    {
      key: "accessCount",
      label: "Opens",
      render: (l) => <span className="text-sm text-cloud-200 tabular-nums">{l.accessCount}</span>,
    },
    {
      key: "pendingDeviceCount",
      label: "Waiting",
      render: (l) =>
        l.pendingDeviceCount > 0 ? (
          <Link
            to={`/admin/licences/${l.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-status-warn hover:bg-amber-500/25"
          >
            <Clock size={12} /> {l.pendingDeviceCount}
          </Link>
        ) : (
          <span className="text-xs text-cloud-500">—</span>
        ),
    },
    {
      key: "distinctIpCount",
      label: "Addresses",
      render: (l) => {
        const noisy = l.distinctIpCount >= SHARING_HINT_IP_COUNT
        return (
          <span
            className={`inline-flex items-center gap-1.5 text-sm tabular-nums ${
              noisy ? "font-semibold text-status-warn" : "text-cloud-200"
            }`}
            title={noisy ? "Opened from several addresses — worth checking the access log" : undefined}
          >
            {noisy && <ShieldAlert size={13} />}
            {l.distinctIpCount}
          </span>
        )
      },
    },
    {
      key: "lastAccessAt",
      label: "Last opened",
      render: (l) =>
        l.lastAccessAt ? (
          <span className="text-xs text-cloud-400">
            {new Date(l.lastAccessAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        ) : (
          <span className="text-xs text-cloud-500">never</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (l) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
            l.status === "revoked" ? "bg-rose-500/15 text-status-bad" : "bg-emerald-500/15 text-status-ok"
          }`}
        >
          {l.status}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Licences"
        description="Every delivered file is tied to one of these. Revoking a licence kills its download immediately."
      />

      <DataTable
        columns={columns}
        rows={licences || []}
        keyField="id"
        loading={isLoading}
        searchable
        searchKeys={[
          (l) => l.key,
          (l) => l.productName,
          (l) => l.user?.name,
          (l) => l.user?.email,
          (l) => l.user?.userId,
        ]}
        filters={[
          {
            key: "status",
            label: "All statuses",
            options: [
              { value: "active", label: "Active" },
              { value: "revoked", label: "Revoked" },
            ],
          },
        ]}
        emptyMessage="No licences yet — they're created when an order is delivered."
        actions={(l) => (
          <>
            <Link
              to={`/admin/licences/${l.id}`}
              className="rounded-lg border border-ink-700 px-2.5 py-1.5 text-xs font-medium text-cloud-300 transition hover:bg-ink-800 hover:text-cloud-100"
            >
              Access log
            </Link>
            {l.status === "active" ? (
              <button
                onClick={() => setPendingRevoke(l)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-status-bad transition hover:bg-rose-500/20"
              >
                <ShieldAlert size={13} /> Revoke
              </button>
            ) : (
              <button
                onClick={() => restore(l)}
                className="flex items-center gap-1.5 rounded-lg border border-ink-700 px-2.5 py-1.5 text-xs font-medium text-status-ok transition hover:bg-ink-800"
              >
                <Undo2 size={13} /> Restore
              </button>
            )}
          </>
        )}
      />

      <ConfirmDialog
        open={Boolean(pendingRevoke)}
        title="Revoke this licence?"
        message={`${pendingRevoke?.user?.name || "This customer"} will lose access to "${pendingRevoke?.productName}" straight away. You can restore it later.`}
        confirmLabel="Revoke"
        busy={setStatus.isPending}
        onCancel={() => setPendingRevoke(null)}
        onConfirm={confirmRevoke}
      />
    </div>
  )
}
