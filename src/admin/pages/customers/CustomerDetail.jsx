import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useCustomer } from "../../../hooks/useUsers"
import { formatINR } from "../../../lib/currency"
import DataTable from "../../components/DataTable"

const STATUS_STYLES = {
  pending: "bg-amber-500/15 text-amber-400",
  paid: "bg-sky-500/15 text-sky-400",
  fulfilled: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-rose-500/15 text-rose-400",
}

export default function CustomerDetail() {
  const { id } = useParams()
  const { data, isLoading } = useCustomer(id)

  const columns = [
    { key: "_id", label: "Order ID", render: (o) => <span className="font-mono text-xs">{o._id.slice(-8)}</span> },
    { key: "items", label: "Items", render: (o) => o.items.length },
    { key: "total", label: "Total", render: (o) => formatINR(o.total) },
    {
      key: "status",
      label: "Status",
      render: (o) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[o.status]}`}>{o.status}</span>
      ),
    },
    { key: "createdAt", label: "Date", render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ]

  if (isLoading) return <p className="text-cloud-500">Loading…</p>
  if (!data) return null

  return (
    <div className="space-y-6">
      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm text-cloud-400 hover:text-cloud-100"
      >
        <ArrowLeft size={15} /> Back to Customers
      </Link>
      <div className="rounded-2xl border border-white/8 bg-ink-850 p-6">
        <h1 className="font-display text-xl font-bold text-cloud-100">{data.user.name}</h1>
        <p className="text-sm text-cloud-400">{data.user.email}</p>
        <p className="mt-1 text-xs text-cloud-500">Joined {new Date(data.user.createdAt).toLocaleDateString()}</p>
      </div>
      <DataTable
        columns={columns}
        rows={data.orders}
        loading={false}
        emptyMessage="No orders from this customer yet."
      />
    </div>
  )
}
