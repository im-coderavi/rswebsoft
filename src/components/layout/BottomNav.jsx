import { NavLink } from "react-router-dom"
import { Home, LayoutGrid, ShoppingCart, Menu } from "lucide-react"
import { useCart } from "../../context/CartContext"

function TabLink({ to, end, icon: Icon, label, badge }) {
  return (
    <NavLink to={to} end={end} className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5">
      {({ isActive }) => (
        <>
          <span className="relative grid place-items-center">
            <Icon
              size={22}
              strokeWidth={isActive ? 2.3 : 1.8}
              className={isActive ? "text-brand-300" : "text-cloud-400"}
            />
            {badge > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-gradient px-1 text-[9px] font-bold text-white">
                {badge}
              </span>
            )}
          </span>
          <span className={["text-[10px] font-medium", isActive ? "text-brand-300" : "text-cloud-400"].join(" ")}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

export default function BottomNav({ onMenuClick }) {
  const { count } = useCart()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-ink-900/80 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch">
        <TabLink to="/" end icon={Home} label="Home" />
        <TabLink to="/products" icon={LayoutGrid} label="Products" />
        <TabLink to="/cart" icon={ShoppingCart} label="Cart" badge={count} />
        <button
          type="button"
          onClick={onMenuClick}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-cloud-400"
        >
          <Menu size={22} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  )
}
