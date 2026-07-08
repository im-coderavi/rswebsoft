import { Link } from "react-router-dom"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import { useCart } from "../context/CartContext"
import { toneGradient } from "../lib/tones"

function initialsOf(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

export default function Cart() {
  const { items, remove, updateQty, subtotal } = useCart()

  if (items.length === 0) {
    return (
      <section className="container-rs flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient-soft text-brand-300">
          <ShoppingBag size={30} />
        </span>
        <h1 className="font-display text-2xl font-bold text-cloud-100">Your cart is empty</h1>
        <p className="mt-2 text-cloud-400">Browse our products and add something you like.</p>
        <Link to="/products" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white">
          Browse Products <ArrowRight size={16} />
        </Link>
      </section>
    )
  }

  return (
    <section className="container-rs py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-cloud-100">Your Cart</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-xl border border-white/8 bg-ink-850 p-4"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg" style={item.image ? undefined : toneGradient("violet")}>
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-sm font-bold text-white">
                    {initialsOf(item.name)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link to={`/products/${item.slug}`} className="truncate text-sm font-semibold text-cloud-100 hover:text-brand-300">
                  {item.name}
                </Link>
                <div className="mt-1 text-sm text-cloud-400">${item.price} each</div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-white/10">
                <button
                  onClick={() => updateQty(item.productId, item.qty - 1)}
                  className="grid h-8 w-8 place-items-center text-cloud-300 hover:text-cloud-100"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm text-cloud-100">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.productId, item.qty + 1)}
                  className="grid h-8 w-8 place-items-center text-cloud-300 hover:text-cloud-100"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="w-16 shrink-0 text-right font-display text-sm font-bold text-cloud-100">
                ${(item.price * item.qty).toFixed(2)}
              </div>

              <button
                onClick={() => remove(item.productId)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-cloud-500 transition hover:bg-rose-500/15 hover:text-rose-400"
                aria-label="Remove item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* summary */}
        <div className="h-fit rounded-2xl border border-white/8 bg-ink-850 p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-cloud-100">Order Summary</h2>
          <div className="flex items-center justify-between text-sm text-cloud-400">
            <span>Subtotal</span>
            <span className="text-cloud-100">${subtotal.toFixed(2)}</span>
          </div>
          <div className="my-4 border-t border-white/8" />
          <div className="flex items-center justify-between font-display text-base font-bold text-cloud-100">
            <span>Total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Proceed to Checkout <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
