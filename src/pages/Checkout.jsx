import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Copy, Check, QrCode } from "lucide-react"
import toast from "react-hot-toast"
import { useCart } from "../context/CartContext"
import { usePaymentSettings } from "../hooks/usePaymentSettings"
import { useCreateOrder } from "../hooks/useOrders"
import { apiErrorMessage } from "../lib/api"
import { formatINR } from "../lib/currency"

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const { data: settings, isLoading: loadingSettings } = usePaymentSettings()
  const createOrder = useCreateOrder()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [paymentReference, setPaymentReference] = useState("")
  const [copied, setCopied] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (items.length === 0 && !submitted) {
    return <Navigate to="/cart" replace />
  }

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function copyUpiId() {
    navigator.clipboard.writeText(settings.upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const order = await createOrder.mutateAsync({
        customer: form,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        paymentReference,
      })
      setSubmitted(true)
      clear()
      toast.success("Order submitted!")
      navigate(`/order/${order._id}`)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const hasQr = settings?.qrImage?.url
  const hasUpi = settings?.upiId

  return (
    <section className="container-rs py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-cloud-100">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* contact info */}
          <div className="rounded-2xl border border-white/8 bg-ink-850 p-6">
            <h2 className="mb-4 font-display text-base font-bold text-cloud-100">Your Details</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">Full Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-cloud-400">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-cloud-400">Phone</label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* payment */}
          <div className="rounded-2xl border border-white/8 bg-ink-850 p-6">
            <h2 className="mb-4 font-display text-base font-bold text-cloud-100">Pay via UPI</h2>

            {loadingSettings ? (
              <p className="text-sm text-cloud-500">Loading payment details…</p>
            ) : !hasQr && !hasUpi ? (
              <p className="text-sm text-cloud-500">
                Payment details haven't been set up yet. Please contact support to complete your order.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                {hasQr && (
                  <div className="shrink-0 rounded-xl border border-white/10 bg-white p-2">
                    <img src={settings.qrImage.url} alt="UPI QR Code" className="h-40 w-40 object-contain" />
                  </div>
                )}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  {!hasQr && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-cloud-400">
                      <QrCode size={15} /> QR code not set — use the UPI ID below
                    </span>
                  )}
                  {settings.payeeName && <p className="text-sm text-cloud-300">Pay to: <strong className="text-cloud-100">{settings.payeeName}</strong></p>}
                  {hasUpi && (
                    <button
                      type="button"
                      onClick={copyUpiId}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm font-mono text-cloud-100 transition hover:border-brand-500/50"
                    >
                      {settings.upiId} {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  )}
                  {settings.note && <p className="text-xs text-cloud-500">{settings.note}</p>}
                </div>
              </div>
            )}

            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                UPI Transaction / Reference ID (after paying)
              </label>
              <input
                required
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. 302301122334"
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-cloud-500">
                We'll verify your payment manually and unlock your download shortly after.
              </p>
            </div>
          </div>
        </div>

        {/* summary */}
        <div className="h-fit space-y-4 rounded-2xl border border-white/8 bg-ink-850 p-6">
          <h2 className="font-display text-lg font-bold text-cloud-100">Order Summary</h2>
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm text-cloud-400">
                <span className="min-w-0 truncate pr-3">{item.name} × {item.qty}</span>
                <span className="shrink-0 text-cloud-100">{formatINR(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 pt-4">
            <div className="flex items-center justify-between font-display text-base font-bold text-cloud-100">
              <span>Total</span>
              <span>{formatINR(subtotal)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={createOrder.isPending}
            className="w-full rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {createOrder.isPending ? "Submitting…" : "I've Paid — Submit Order"}
          </button>
        </div>
      </form>
    </section>
  )
}
