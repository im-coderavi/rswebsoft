import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Heart, ShoppingCart, Menu, User, Sun, Moon, LogOut, Package } from "lucide-react"
import Logo from "../ui/Logo"
import HeaderSearch from "./HeaderSearch"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../context/AuthContext"

function ActionIcon({ icon: Icon, count, to }) {
  return (
    <Link
      to={to}
      className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-cloud-300 transition hover:bg-ink-800 hover:text-cloud-100 sm:h-10 sm:w-10"
    >
      <Icon size={19} className="sm:hidden" />
      <Icon size={20} className="hidden sm:block" />
      {count != null && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-gradient px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  )
}

function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ml-0.5 flex shrink-0 items-center gap-2 rounded-xl bg-brand-gradient px-2.5 py-2 text-sm font-semibold text-white transition hover:opacity-95 glow-shadow sm:ml-1 sm:px-5 sm:py-2.5"
      >
        <User size={16} />
        <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-ink-800 py-1.5 shadow-xl">
          <Link
            to="/account/orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm text-cloud-200 hover:bg-ink-700 hover:text-cloud-100"
          >
            <Package size={15} /> My Orders
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-cloud-200 hover:bg-ink-700 hover:text-cloud-100"
          >
            <LogOut size={15} /> Log Out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Header({ onMenuClick }) {
  const { count } = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(false)

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
  }

  function handleLogout() {
    logout()
    navigate("/")
  }

  return (
    <div className="border-b border-white/5 bg-ink-900/95">
      <div className="container-rs flex h-[72px] min-w-0 items-center gap-1.5 sm:gap-3">
        <button
          onClick={onMenuClick}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-cloud-300 transition hover:bg-ink-800 hover:text-cloud-100 sm:h-10 sm:w-10 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <Logo />

        <HeaderSearch />

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <ActionIcon icon={Heart} count={3} to="/wishlist" />
          <ActionIcon icon={ShoppingCart} count={count} to="/cart" />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-cloud-300 transition hover:bg-ink-800 hover:text-cloud-100 sm:h-10 sm:w-10 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {user ? (
            <AccountMenu user={user} onLogout={handleLogout} />
          ) : (
            <Link
              to="/login"
              className="ml-0.5 flex shrink-0 items-center gap-2 rounded-xl bg-brand-gradient px-2.5 py-2 text-sm font-semibold text-white transition hover:opacity-95 glow-shadow sm:ml-1 sm:px-5 sm:py-2.5"
            >
              <User size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Login / Register</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
