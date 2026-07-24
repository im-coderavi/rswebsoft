import { useState, useEffect } from "react"
import { NavLink, Link, useNavigate } from "react-router-dom"
import { X, Heart, ShoppingCart, User, Sun, Moon, LogOut, Package } from "lucide-react"
import { navLinks } from "../../data/site"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../context/AuthContext"

export default function MobileMenu({ open, onClose }) {
  const { count } = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(false)
  const [search, setSearch] = useState("")

  // Sync theme status on component mount
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
      setIsDark(false)
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setIsDark(true)
    }
  };

  function handleLogout() {
    onClose()
    logout()
    navigate("/")
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    const q = search.trim()
    if (!q) return
    onClose()
    navigate(`/products?search=${encodeURIComponent(q)}`)
    setSearch("")
  }

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

        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 border-b border-white/8 px-4 py-3"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="flex-1 rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
          />
          <Link
            to="/products"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-xs font-semibold text-cloud-200 hover:bg-ink-700"
          >
            All
          </Link>
        </form>

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

          {/* Mobile Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100 cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun size={17} /> Light Mode
              </>
            ) : (
              <>
                <Moon size={17} /> Dark Mode
              </>
            )}
          </button>

          {user ? (
            <>
              <Link
                to="/account/orders"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
              >
                <Package size={17} /> My Orders
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
              >
                <LogOut size={17} /> Log Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
            >
              <User size={17} /> Login / Register
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
