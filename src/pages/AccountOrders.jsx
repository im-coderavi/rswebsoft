import { Link } from "react-router-dom"
import { useMyOrders } from "../hooks/useOrders"
import { formatINR } from "../lib/currency"

const STATUS_STYLES = {
  pending: "bg-amber-500/15 text-amber-400",
  paid: "bg-sky-500/15 text-sky-400",
  fulfilled: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-rose-500/15 text-rose-400",
}

export default function AccountOrders() {
  const { data: orders, isLoading } = useMyOrders()

  return (
    <section className="container-rs py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-cloud-100">My Orders</h1>

      {isLoading && <p className="text-sm text-cloud-500">Loading your orders…</p>}

      {!isLoading && (!orders || orders.length === 0) && (
        <p className="text-sm text-cloud-500">You haven't placed any orders yet.</p>
      )}

      {!isLoading && orders?.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/order/${order._id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-ink-850 p-5 transition hover:border-brand-500/40"
            >
              <div>
                <div className="font-mono text-xs text-cloud-500">#{order._id.slice(-8)}</div>
                <div className="text-sm text-cloud-300">
                  {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-cloud-100">{formatINR(order.total)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                  {order.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
