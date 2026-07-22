import Icon from "../ui/Icon"
import AnimatedCounter from "../ui/AnimatedCounter"
import { RevealGroup, RevealItem } from "../ui/Reveal"
import { useSiteStats } from "../../hooks/useSiteStats"

// Uptime/support aren't measurable per-account numbers — kept as fixed
// service claims alongside the real, database-backed counts below.
const STATIC_STATS = [
  { icon: "Activity", value: "99.9%", label: "Uptime" },
  { icon: "Headphones", value: "24/7", label: "Support" },
]

export default function StatsStrip() {
  const { data, isLoading } = useSiteStats()

  const liveStats = [
    { icon: "Package", value: isLoading ? "…" : `${data.products}+`, label: "Products" },
    { icon: "Grid3x3", value: isLoading ? "…" : `${data.categories}+`, label: "Categories" },
    { icon: "Building2", value: isLoading ? "…" : `${data.brands}+`, label: "Sister Brands" },
    { icon: "Smile", value: isLoading ? "…" : `${data.customers}+`, label: "Happy Customers" },
  ]
  const statStrip = [...liveStats, ...STATIC_STATS]

  return (
    <section className="container-rs -mt-4 pb-4">
      <RevealGroup className="grid grid-cols-2 gap-y-6 rounded-2xl border border-white/8 bg-ink-850/80 px-6 py-6 backdrop-blur sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-white/8">
        {statStrip.map((item) => (
          <RevealItem key={item.label} className="flex items-center gap-3 px-2 lg:justify-center">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-gradient-soft text-brand-300">
              <Icon name={item.icon} size={18} />
            </span>
            <div className="leading-tight">
              <AnimatedCounter value={item.value} className="font-display text-lg font-bold text-cloud-100" />
              <div className="text-xs text-cloud-400">{item.label}</div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  )
}
