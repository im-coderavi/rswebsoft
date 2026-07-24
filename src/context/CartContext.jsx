import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react"

const CartContext = createContext(null)
const STORAGE_KEY = "rs_cart"

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.productId && i.packageId === product.packageId)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.productId && i.packageId === product.packageId ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [...prev, { ...product, qty }]
    })
  }, [])

  const remove = useCallback((productId, packageId) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.packageId === packageId)))
  }, [])

  const updateQty = useCallback((productId, qty, packageId) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId && i.packageId === packageId ? { ...i, qty: Math.max(1, qty) } : i))
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const { count, subtotal } = useMemo(
    () => ({
      count: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    [items]
  )

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
