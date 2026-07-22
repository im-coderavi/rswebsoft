import { motion } from "framer-motion"
import {
  Package,
  CheckCircle2,
  Grid3x3,
  Building2,
  ShoppingCart,
  Users,
  Monitor,
  Mail,
} from "lucide-react"
import { useDashboardStats } from "../../hooks/useDashboardStats"
import AnimatedCounter from "../../components/ui/AnimatedCounter"

// Same grouping as the sidebar (Catalog / Sales / Site Content) so the
// dashboard teaches the same mental model of the business at a glance.
const CLUSTERS = [
  {
    label: "Catalog",
    cards: [
      { key: "products", label: "Total Products", icon: Package, tone: "text-brand-300", bg: "bg-brand-500/15" },
      { key: "publishedProducts", label: "Published", icon: CheckCircle2, tone: "text-emerald-400", bg: "bg-emerald-500/15" },
      { key: "categories", label: "Categories", icon: Grid3x3, tone: "text-sky-400", bg: "bg-sky-500/15" },
      { key: "brands", label: "Brands", icon: Building2, tone: "text-amber-400", bg: "bg-amber-500/15" },
    ],
  },
  {
    label: "Sales",
    cards: [
      { key: "orders", label: "Orders", icon: ShoppingCart, tone: "text-pink-400", bg: "bg-pink-500/15" },
      { key: "customers", label: "Customers", icon: Users, tone: "text-indigo-400", bg: "bg-indigo-500/15" },
    ],
  },
  {
    label: "Site Content",
    cards: [
      { key: "demoLinks", label: "Demo Links", icon: Monitor, tone: "text-cyan-400", bg: "bg-cyan-500/15" },
      { key: "subscribers", label: "Newsletter Subscribers", icon: Mail, tone: "text-rose-400", bg: "bg-rose-500/15" },
    ],
  },
]

function StatCard({ label, icon: Icon, tone, bg, value, isLoading, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
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
            <AnimatedCounter value={String(value ?? 0)} className="font-display text-2xl font-bold text-cloud-100" />
          )}
          <div className="text-xs text-cloud-400">{label}</div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useDashboardStats()

  let cardIndex = 0

  return (
    <div className="space-y-8">
      <p className="text-sm text-cloud-400">Overview of your catalog and activity.</p>

      {CLUSTERS.map((cluster) => (
        <div key={cluster.label}>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-cloud-600">{cluster.label}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cluster.cards.map((card) => {
              const delay = cardIndex * 0.06
              cardIndex += 1
              return (
                <StatCard
                  key={card.key}
                  label={card.label}
                  icon={card.icon}
                  tone={card.tone}
                  bg={card.bg}
                  value={data?.[card.key]}
                  isLoading={isLoading}
                  delay={delay}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
