import { Search, Heart, ShoppingCart, ChevronDown } from "lucide-react"
import Logo from "../ui/Logo"

function ActionIcon({ icon: Icon, count }) {
  return (
    <button className="relative grid h-10 w-10 place-items-center rounded-xl text-cloud-300 transition hover:bg-ink-800 hover:text-cloud-100">
      <Icon size={20} />
      {count != null && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-gradient px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  )
}

export default function Header() {
  return (
    <div className="border-b border-white/5 bg-ink-900/95">
      <div className="container-rs flex h-[72px] items-center gap-4">
        <Logo />

        {/* Search with category selector */}
        <div className="ml-2 hidden max-w-[560px] flex-1 items-center rounded-xl border border-white/10 bg-ink-800 focus-within:border-brand-500/60 lg:flex">
          <button className="flex shrink-0 items-center gap-1.5 border-r border-white/10 px-4 py-2.5 text-sm font-medium text-cloud-300 transition hover:text-cloud-100">
            All Categories <ChevronDown size={15} />
          </button>
          <input
            type="text"
            placeholder="Search for products, themes, plugins, tools..."
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:outline-none"
          />
          <button className="m-1 grid h-9 w-10 shrink-0 place-items-center rounded-lg bg-brand-gradient text-white">
            <Search size={18} />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden items-center gap-1 sm:flex">
            <ActionIcon icon={Heart} count={3} />
            <ActionIcon icon={ShoppingCart} count={0} />
          </div>
          <button className="ml-1.5 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 glow-shadow">
            Login / Register
          </button>
        </div>
      </div>
    </div>
  )
}
