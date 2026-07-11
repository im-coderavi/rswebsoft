import { motion } from "framer-motion"
import { Package, Grid3x3, Building2, ShoppingCart, Users, CheckCircle2 } from "lucide-react"
import { useDashboardStats } from "../../hooks/useDashboardStats"
import AnimatedCounter from "../../components/ui/AnimatedCounter"

const CARDS = [
  { key: "products", label: "Total Products", icon: Package, tone: "text-brand-300", bg: "bg-brand-500/15" },
  { key: "publishedProducts", label: "Published", icon: CheckCircle2, tone: "text-emerald-400", bg: "bg-emerald-500/15" },
  { key: "categories", label: "Categories", icon: Grid3x3, tone: "text-sky-400", bg: "bg-sky-500/15" },
  { key: "brands", label: "Brands", icon: Building2, tone: "text-amber-400", bg: "bg-amber-500/15" },
  { key: "orders", label: "Orders", icon: ShoppingCart, tone: "text-pink-400", bg: "bg-pink-500/15" },
  { key: "users", label: "Users", icon: Users, tone: "text-indigo-400", bg: "bg-indigo-500/15" },
]

export default function Dashboard() {
  const { data, isLoading } = useDashboardStats()

  return (
    <div>
      <p className="mb-5 text-sm text-cloud-400">Overview of your catalog and activity.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ key, label, icon: Icon, tone, bg }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="rounded-2xl border border-white/8 bg-ink-850 p-5"
          >
            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${bg} ${tone}`}>
                <Icon size={20} />
              </span>
              <div>
                {isLoading ? (
                  <div className="font-display text-2xl font-bold text-cloud-100">…</div>
                ) : (
                  <AnimatedCounter
                    value={String(data?.[key] ?? 0)}
                    className="font-display text-2xl font-bold text-cloud-100"
                  />
                )}
                <div className="text-xs text-cloud-400">{label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
