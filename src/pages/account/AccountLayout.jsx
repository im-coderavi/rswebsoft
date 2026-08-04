import { NavLink, Outlet } from "react-router-dom"
import { User, Package, Download, LogOut } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

// Sidebar on desktop, a scrollable tab strip on mobile. Wishlist, coupons and
// gift cards slot in here as extra NAV_ITEMS when they're built.
const NAV_ITEMS = [
  { to: "/account/profile", label: "Profile", icon: User },
  { to: "/account/orders", label: "Orders", icon: Package },
  { to: "/account/downloads", label: "Downloads", icon: Download },
]

function initialsOf(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  )
}

export default function AccountLayout() {
  const { user, logout } = useAuth()

  const linkClass = ({ isActive }) =>
    `flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
      isActive
        ? "bg-brand-500/15 text-brand-300"
        : "text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
    }`

  return (
    <section className="container-rs py-10">
      <div className="mb-7 flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-gradient font-display text-lg font-bold text-white">
          {initialsOf(user?.name)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold text-cloud-100">{user?.name}</h1>
          <p className="truncate text-sm text-cloud-500">
            {user?.email}
            {user?.userId && (
              <>
                <span className="mx-2 text-cloud-500/40">·</span>
                <span className="font-mono">{user.userId}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={logout}
            className="flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100 lg:mt-1"
          >
            <LogOut size={16} /> Log out
          </button>
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </section>
  )
}
