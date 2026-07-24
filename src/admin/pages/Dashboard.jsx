import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  Package,
  CheckCircle2,
  Grid3x3,
  Building2,
  ShoppingCart,
  Users,
  Monitor,
  Mail,
  ArrowUp,
  ArrowDown,
  Plus,
  Rows3,
} from "lucide-react"
import { useDashboardStats } from "../../hooks/useDashboardStats"
import AnimatedCounter from "../../components/ui/AnimatedCounter"
import PageHeader from "../components/PageHeader"
import Button from "../components/Button"

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

const QUICK_ACTIONS = [
  { label: "Add Product", to: "/admin/products/new", icon: Plus },
  { label: "New Homepage Section", to: "/admin/sections", icon: Rows3 },
  { label: "New Category", to: "/admin/categories", icon: Grid3x3 },
]

function TrendIndicator({ trend }) {
  if (trend == null) return null
  const isUp = trend >= 0
  const ArrowIcon = isUp ? ArrowUp : ArrowDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
      <ArrowIcon size={12} />
      {Math.abs(trend)}%
    </span>
  )
}

function StatCard({ label, icon: Icon, tone, bg, value, trend, isLoading, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="group relative rounded-xl border border-white/10 bg-gradient-to-br from-ink-850 to-ink-900 p-6 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-ink-950/50"
    >
      <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{
        background: `radial-gradient(circle at top right, ${bg.replace('bg-', 'rgba(').split('/')[0]}20), transparent)`
      }} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isLoading ? (
              <div className="font-display text-3xl font-bold text-cloud-100">…</div>
            ) : (
              <>
                <AnimatedCounter value={String(value ?? 0)} className="font-display text-3xl font-bold text-cloud-100" />
                {!isLoading && trend != null && <TrendIndicator trend={trend} />}
              </>
            )}
          </div>
          <div className="text-xs font-medium text-cloud-500">{label}</div>
        </div>
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${bg} ${tone} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={24} />
        </span>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useDashboardStats()
  const navigate = useNavigate()

  let cardIndex = 0

  return (
    <div className="space-y-10">
      <div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PageHeader title="Dashboard" description="Real-time overview of your catalog, sales, and site content." />
        </motion.div>
      </div>

      {CLUSTERS.map((cluster, clusterIndex) => (
        <motion.div
          key={cluster.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: clusterIndex * 0.1 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-emerald-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-cloud-500">{cluster.label}</p>
          </div>
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
                  trend={data?.[`${card.key}Trend`]}
                  isLoading={isLoading}
                  delay={delay}
                />
              )
            })}
          </div>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-xl border border-white/10 bg-gradient-to-r from-emerald-500/5 to-transparent p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-emerald-500" />
          <p className="text-xs font-bold uppercase tracking-widest text-cloud-500">Quick Actions</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.to}
              variant="secondary"
              icon={action.icon}
              onClick={() => navigate(action.to)}
              className="w-full justify-center transition-all duration-300 hover:bg-emerald-500/20"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
