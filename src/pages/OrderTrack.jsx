import { useParams, Link } from "react-router-dom"
import { CheckCircle2, Clock, Download, XCircle, PackageCheck } from "lucide-react"
import { useTrackOrder } from "../hooks/useOrders"

const STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "paid", label: "Payment Verified", icon: CheckCircle2 },
  { key: "fulfilled", label: "Delivered", icon: PackageCheck },
]

function stepIndex(status) {
  if (status === "cancelled") return -1
  return STEPS.findIndex((s) => s.key === status)
}

export default function OrderTrack() {
  const { id } = useParams()
  const { data: order, isLoading, isError } = useTrackOrder(id)

  if (isLoading) {
    return <p className="container-rs py-20 text-center text-cloud-500">Loading order…</p>
  }
  if (isError || !order) {
    return <p className="container-rs py-20 text-center text-cloud-500">Order not found.</p>
  }

  const currentStep = stepIndex(order.status)
  const isCancelled = order.status === "cancelled"

  return (
    <section className="container-rs max-w-2xl py-10">
      <h1 className="mb-1 font-display text-2xl font-bold text-cloud-100">Order Confirmation</h1>
      <p className="mb-8 text-sm text-cloud-500">Order ID: <span className="font-mono">{order._id}</span></p>

      {isCancelled ? (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
          <XCircle size={20} /> This order has been cancelled.
        </div>
      ) : (
        <div className="mb-10 flex items-center justify-between">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const done = i <= currentStep
            return (
              <div key={step.key} className="flex flex-1 flex-col items-center text-center">
                <div className="flex w-full items-center">
                  <div className={`h-0.5 flex-1 ${i === 0 ? "invisible" : done ? "bg-brand-500" : "bg-ink-700"}`} />
                  <span
                    className={[
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                      done ? "bg-brand-gradient text-white" : "bg-ink-800 text-cloud-500",
                    ].join(" ")}
                  >
                    <Icon size={17} />
                  </span>
                  <div className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? "invisible" : done && i < currentStep ? "bg-brand-500" : "bg-ink-700"}`} />
                </div>
                <span className={`mt-2 text-xs font-medium ${done ? "text-cloud-100" : "text-cloud-500"}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-2xl border border-white/8 bg-ink-850 p-6">
        <h2 className="mb-4 font-display text-base font-bold text-cloud-100">Items</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
              <div>
                <div className="text-sm font-medium text-cloud-100">{item.name} × {item.qty}</div>
                <div className="text-xs text-cloud-500">${item.price} each</div>
              </div>
              {item.downloadUrl ? (
                <a
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Download size={13} /> Download
                </a>
              ) : (
                <span className="text-xs text-cloud-500">Pending verification</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4 font-display text-base font-bold text-cloud-100">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-cloud-500">
        Bookmark this page to check your order status later, or{" "}
        <Link to="/products" className="text-brand-300 hover:underline">keep browsing</Link>.
      </p>
    </section>
  )
}
