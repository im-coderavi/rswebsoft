import { NavLink, Link } from "react-router-dom"
import { X, Search, Heart, ShoppingCart, User } from "lucide-react"
import { navLinks } from "../../data/site"
import { useCart } from "../../context/CartContext"

export default function MobileMenu({ open, onClose }) {
  const { count } = useCart()

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <div
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-sm -translate-x-full flex-col bg-ink-900 transition-transform duration-200 lg:hidden",
          open ? "translate-x-0" : "",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <span className="font-display text-lg font-bold text-cloud-100">Menu</span>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-white/8 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800 px-3 py-2.5">
            <Search size={16} className="text-cloud-500" />
            <input
              type="text"
              placeholder="Search products…"
              className="flex-1 bg-transparent text-sm text-cloud-100 placeholder:text-cloud-500 focus:outline-none"
            />
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "block rounded-lg px-3.5 py-2.5 text-sm font-medium transition",
                  isActive ? "bg-ink-800 text-cloud-100" : "text-cloud-400 hover:bg-ink-800 hover:text-cloud-100",
                ].join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/8 p-4">
          <Link
            to="/wishlist"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
          >
            <Heart size={17} /> Wishlist
          </Link>
          <Link
            to="/cart"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
          >
            <ShoppingCart size={17} /> Cart {count > 0 && `(${count})`}
          </Link>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
          >
            <User size={17} /> Login / Register
          </button>
        </div>
      </div>
    </>
  )
}
