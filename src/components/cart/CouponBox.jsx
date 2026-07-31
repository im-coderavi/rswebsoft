import { useState, useEffect } from "react"
import { Tag, X } from "lucide-react"
import toast from "react-hot-toast"
import { useCart } from "../../context/CartContext"
import { apiErrorMessage } from "../../lib/api"
import { formatINR } from "../../lib/currency"

export default function CouponBox() {
  const { coupon, applyCoupon, removeCoupon, couponWarning, clearCouponWarning } = useCart()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (couponWarning) {
      toast.error(couponWarning)
      clearCouponWarning()
    }
  }, [couponWarning, clearCouponWarning])

  async function handleApply(e) {
    e.preventDefault()
    if (!code.trim()) return
    setApplying(true)
    setError("")
    try {
      await applyCoupon(code)
      setCode("")
      toast.success("Coupon applied")
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setApplying(false)
    }
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-emerald-400">
          <Tag size={14} /> Coupon {coupon.code} applied — −{formatINR(coupon.discountAmount)}
        </span>
        <button
          type="button"
          onClick={removeCoupon}
          className="text-cloud-400 transition hover:text-cloud-100"
          aria-label="Remove coupon"
        >
          <X size={15} />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleApply} className="space-y-1.5">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Have a coupon?"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={applying}
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-cloud-100 transition hover:bg-white/10 disabled:opacity-60"
        >
          {applying ? "Applying…" : "Apply"}
        </button>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </form>
  )
}
