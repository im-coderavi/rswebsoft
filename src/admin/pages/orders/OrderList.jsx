import toast from "react-hot-toast"
import { useOrders, useUpdateOrderStatus } from "../../../hooks/useOrders"
import { apiErrorMessage } from "../../../lib/api"
import DataTable from "../../components/DataTable"

const STATUSES = ["pending", "paid", "fulfilled", "cancelled"]

const STATUS_STYLES = {
  pending: "bg-amber-500/15 text-amber-400",
  paid: "bg-sky-500/15 text-sky-400",
  fulfilled: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-rose-500/15 text-rose-400",
}

export default function OrderList() {
  const { data: orders, isLoading } = useOrders()
  const updateStatus = useUpdateOrderStatus()

  async function handleStatusChange(id, status) {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success("Order status updated")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const columns = [
    { key: "_id", label: "Order ID", render: (o) => <span className="font-mono text-xs">{o._id.slice(-8)}</span> },
    {
      key: "customer",
      label: "Customer",
      render: (o) => (
        <div>
          <div className="font-medium text-cloud-100">{o.customer?.name}</div>
          <div className="text-xs text-cloud-500">{o.customer?.email}</div>
        </div>
      ),
    },
    { key: "items", label: "Items", render: (o) => o.items.length },
    { key: "total", label: "Total", render: (o) => `$${o.total.toFixed(2)}` },
    {
      key: "paymentReference",
      label: "UPI Ref",
      render: (o) => o.paymentReference || <span className="text-cloud-600">—</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (o) => (
        <select
          value={o.status}
          onChange={(e) => handleStatusChange(o._id, e.target.value)}
          className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium focus:outline-none ${STATUS_STYLES[o.status]}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-ink-850 text-cloud-100">
              {s}
            </option>
          ))}
        </select>
      ),
    },
    { key: "createdAt", label: "Date", render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ]

  return (
    <DataTable
      columns={columns}
      rows={orders || []}
      loading={isLoading}
      emptyMessage="No orders yet — this fills up once the storefront checkout is live."
    />
  )
}
