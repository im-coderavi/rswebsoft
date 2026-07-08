import { NavLink } from "react-router-dom"
import { LayoutDashboard, Package, Grid3x3, Building2, ShoppingCart, CreditCard, X } from "lucide-react"
import Logo from "../../components/ui/Logo"

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Grid3x3 },
  { to: "/admin/brands", label: "Brands", icon: Building2 },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/settings", label: "Payment Settings", icon: CreditCard },
]

export default function AdminSidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 -translate-x-full flex-col border-r border-white/8 bg-ink-900 transition-transform duration-200",
          "lg:static lg:translate-x-0",
          open ? "translate-x-0" : "",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-5">
          <Logo compact />
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 hover:bg-ink-800 hover:text-cloud-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-brand-gradient text-white glow-shadow"
                    : "text-cloud-400 hover:bg-ink-800 hover:text-cloud-100",
                ].join(" ")
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/8 p-4 text-xs text-cloud-500">
          RSWebSoft Admin Panel
        </div>
      </aside>
    </>
  )
}
