import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import { CheckCircle2, Send } from "lucide-react"
import { useOrders, useUpdateOrderStatus, useVerifyOrderPayment, useSendOrderProduct } from "../../../hooks/useOrders"
import { apiErrorMessage } from "../../../lib/api"
import DataTable from "../../components/DataTable"
import PageHeader from "../../components/PageHeader"

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
  const verifyPayment = useVerifyOrderPayment()
  const sendProduct = useSendOrderProduct()

  async function handleStatusChange(id, status) {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success("Order status updated")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function handleVerifyPayment(id) {
    try {
      const updated = await verifyPayment.mutateAsync(id)
      if (updated.autoSendFailed) {
        toast.error("Payment verified, but auto-send email failed — use Send Product to retry")
      } else {
        toast.success(updated.status === "fulfilled" ? "Payment verified and product auto-sent" : "Payment verified")
      }
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function handleSendProduct(id) {
    try {
      await sendProduct.mutateAsync(id)
      toast.success("Product sent to customer")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  // Nine columns guaranteed a horizontal scrollbar, which pushed the row
  // actions out of sight. Related facts are grouped into one cell instead, so
  // the whole order reads without scrolling: who ordered, what, what it cost.
  const columns = [
    {
      key: "_id",
      label: "Order",
      render: (o) => (
        <div>
          <div className="font-mono text-xs text-cloud-300">{o._id.slice(-8)}</div>
          <div className="mt-0.5 text-xs text-cloud-500">
            {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
          </div>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      cellClassName: "max-w-[15rem]",
      render: (o) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-cloud-100" title={o.customer?.name}>
            {o.customer?.name}
          </div>
          <div className="truncate text-xs text-cloud-500" title={o.customer?.email}>
            {o.customer?.email}
          </div>
          <div className="mt-1 text-xs">
            {o.user ? (
              <Link to={`/admin/customers/${o.user._id}`} className="text-brand-300 hover:underline">
                Account: {o.user.name}
              </Link>
            ) : (
              <span className="text-cloud-500">Guest checkout</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "items",
      label: "Products",
      cellClassName: "max-w-0 w-full",
      render: (o) => (
        <div className="min-w-0 space-y-1">
          {o.items.map((item, idx) => (
            <div key={idx} className="flex min-w-0 items-baseline gap-1.5 text-xs">
              <span className="truncate text-cloud-200" title={item.name}>{item.name}</span>
              <span className="shrink-0 text-cloud-500">×{item.qty}</span>
              {item.product?.downloadUrl && o.status === "fulfilled" && (
                <a
                  href={item.product.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-brand-300 hover:underline"
                >
                  link
                </a>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "total",
      label: "Payment",
      render: (o) => (
        <div>
          <div className="font-semibold text-cloud-100 tabular-nums">₹{o.total.toLocaleString("en-IN")}</div>
          {o.discountAmount > 0 && (
            <div className="text-xs text-status-ok tabular-nums">
              {o.couponCode} (−₹{o.discountAmount.toLocaleString("en-IN")})
            </div>
          )}
          <div className="mt-0.5 truncate font-mono text-[11px] text-cloud-500" title={o.paymentReference}>
            {o.paymentReference ? `UPI ${o.paymentReference}` : "No UPI ref"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (o) => (
        <select
          value={o.status}
          onChange={(e) => handleStatusChange(o._id, e.target.value)}
          className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium capitalize focus:outline-none ${STATUS_STYLES[o.status]}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-ink-850 text-cloud-100">
              {s}
            </option>
          ))}
        </select>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Orders" description="Verify payments and deliver products to customers." />

      <DataTable
      columns={columns}
      rows={orders || []}
      loading={isLoading}
      searchable
      searchKeys={[
        (o) => o.customer?.name,
        (o) => o.customer?.email,
        (o) => o._id,
        (o) => o.paymentReference,
        (o) => o.items?.map((i) => i.name).join(" "),
      ]}
      filters={[
        {
          key: "status",
          label: "All statuses",
          options: STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })),
        },
      ]}
      emptyMessage="No orders yet — this fills up once the storefront checkout is live."
      actions={(o) => (
        <>
          {o.status === "pending" && (
            <button
              onClick={() => handleVerifyPayment(o._id)}
              disabled={verifyPayment.isPending}
              className="flex items-center gap-1 rounded-lg bg-sky-500/15 px-2.5 py-1.5 text-xs font-medium text-sky-400 transition hover:bg-sky-500/25 disabled:opacity-60"
            >
              <CheckCircle2 size={13} /> Verify Payment
            </button>
          )}
          {o.status === "paid" && (
            <button
              onClick={() => handleSendProduct(o._id)}
              disabled={sendProduct.isPending}
              className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/25 disabled:opacity-60"
            >
              <Send size={13} /> Send Product
            </button>
          )}
          {o.status === "fulfilled" && o.productSentAt && (
            <span className="text-xs text-cloud-500">
              Sent {new Date(o.productSentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          )}
          {o.status === "cancelled" && <span className="text-xs text-cloud-500">Cancelled</span>}
        </>
      )}
      />
    </div>
  )
}
