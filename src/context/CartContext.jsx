import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react"
import { applyCouponRequest } from "../hooks/useCoupons"

const CartContext = createContext(null)
const STORAGE_KEY = "rs_cart"
const COUPON_STORAGE_KEY = "rs_cart_coupon"

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function loadCoupon() {
  try {
    const raw = localStorage.getItem(COUPON_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)
  const [coupon, setCoupon] = useState(loadCoupon)
  const [couponWarning, setCouponWarning] = useState(null)
  const isFirstItemsRender = useRef(true)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    if (coupon) localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon))
    else localStorage.removeItem(COUPON_STORAGE_KEY)
  }, [coupon])

  // Re-validate the applied coupon whenever cart contents change (qty edits,
  // removals): a coupon that was valid can become invalid after an edit
  // (minimum order value no longer met, or its only matching product was
  // removed), so the shown discount must never go stale.
  useEffect(() => {
    if (isFirstItemsRender.current) {
      isFirstItemsRender.current = false
      return
    }
    if (!coupon) return

    const payloadItems = items.map((i) => ({ productId: i.productId, qty: i.qty }))
    if (payloadItems.length === 0) {
      setCoupon(null)
      return
    }

    applyCouponRequest(coupon.code, payloadItems)
      .then((result) => {
        setCoupon((prev) =>
          prev ? { ...prev, discountAmount: result.discountAmount, matchedProductIds: result.matchedProductIds } : prev
        )
      })
      .catch((err) => {
        setCoupon(null)
        setCouponWarning(err?.response?.data?.message || "Your coupon no longer applies to this cart and was removed")
      })
    // Only re-run when items change — coupon itself is updated inside this
    // effect, so including it would create a self-triggering loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.productId ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [...prev, { ...product, qty }]
    })
  }, [])

  const remove = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const updateQty = useCallback((productId, qty) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i))
    )
  }, [])

  const clear = useCallback(() => {
    setItems([])
    setCoupon(null)
  }, [])

  const applyCoupon = useCallback(
    async (code) => {
      const payloadItems = items.map((i) => ({ productId: i.productId, qty: i.qty }))
      const result = await applyCouponRequest(code, payloadItems)
      setCoupon({
        code: code.trim().toUpperCase(),
        discountAmount: result.discountAmount,
        matchedProductIds: result.matchedProductIds,
      })
    },
    [items]
  )

  const removeCoupon = useCallback(() => setCoupon(null), [])
  const clearCouponWarning = useCallback(() => setCouponWarning(null), [])

  const { count, subtotal } = useMemo(
    () => ({
      count: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    [items]
  )

  const discountAmount = coupon?.discountAmount || 0
  const total = subtotal - discountAmount

  return (
    <CartContext.Provider
      value={{
        items,
        add,
        remove,
        updateQty,
        clear,
        count,
        subtotal,
        coupon,
        applyCoupon,
        removeCoupon,
        discountAmount,
        total,
        couponWarning,
        clearCouponWarning,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
