import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import { CheckCircle2, Send } from "lucide-react"
import { useOrders, useUpdateOrderStatus, useVerifyOrderPayment, useSendOrderProduct } from "../../../hooks/useOrders"
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
    {
      key: "account",
      label: "Account",
      render: (o) =>
        o.user ? (
          <Link to={`/admin/customers/${o.user._id}`} className="text-brand-300 hover:underline">
            {o.user.name}
          </Link>
        ) : (
          <span className="text-cloud-600">Guest</span>
        ),
    },
    {
      key: "items",
      label: "Products",
      render: (o) => (
        <div className="space-y-1">
          {o.items.map((item, idx) => (
            <div key={idx} className="text-xs">
              <span className="text-cloud-200">{item.name}</span>
              <span className="text-cloud-600"> ×{item.qty}</span>
              {item.product?.downloadUrl && o.status === "fulfilled" && (
                <a
                  href={item.product.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1.5 text-brand-300 hover:underline"
                >
                  link
                </a>
              )}
            </div>
          ))}
        </div>
      ),
    },
    { key: "total", label: "Total", render: (o) => `₹${o.total.toLocaleString("en-IN")}` },
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
            <span className="text-xs text-cloud-500">Sent {new Date(o.productSentAt).toLocaleDateString()}</span>
          )}
        </>
      )}
    />
  )
}
