import { Link } from "react-router-dom"
import { Package, ArrowRight } from "lucide-react"
import { useMyOrders } from "../../hooks/useOrders"
import { formatINR } from "../../lib/currency"

const STATUS_TEXT = {
  pending: { label: "Awaiting payment", tone: "text-status-warn" },
  paid: { label: "Preparing your files", tone: "text-status-info" },
  fulfilled: { label: "Delivered", tone: "text-status-ok" },
  cancelled: { label: "Cancelled", tone: "text-status-bad" },
}

export default function Orders() {
  const { data: orders, isLoading } = useMyOrders()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[4.75rem] animate-pulse rounded-2xl bg-ink-850" />
        ))}
      </div>
    )
  }

  if (!orders?.length) {
    return (
      <div className="rounded-2xl border border-ink-800 bg-ink-850 px-6 py-14 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-ink-800 text-cloud-500">
          <Package size={20} />
        </span>
        <h2 className="font-display text-base font-bold text-cloud-100">No orders yet</h2>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-cloud-500">
          Anything you buy shows up here with its download links.
        </p>
        <Link
          to="/products"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
        >
          Browse products <ArrowRight size={15} />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const status = STATUS_TEXT[order.status] ?? { label: order.status, tone: "text-cloud-500" }
        return (
          <Link
            key={order._id}
            to={`/order/${order._id}`}
            className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-800 bg-ink-850 p-5 transition hover:border-brand-500/40"
          >
            <div className="min-w-0">
              <div className="font-mono text-xs text-cloud-500">#{order._id.slice(-8)}</div>
              <div className="mt-1 text-sm text-cloud-300">
                {order.items.length} item{order.items.length === 1 ? "" : "s"}
                <span className="mx-1.5 text-cloud-500/40">·</span>
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs font-medium ${status.tone}`}>{status.label}</span>
              <span className="font-display font-bold text-cloud-100 tabular-nums">
                {formatINR(order.total)}
              </span>
              <ArrowRight
                size={16}
                className="text-cloud-500 transition group-hover:translate-x-0.5 group-hover:text-cloud-300"
              />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
