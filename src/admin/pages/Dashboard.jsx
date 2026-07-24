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
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="font-display text-2xl font-bold text-cloud-100">…</div>
            ) : (
              <AnimatedCounter value={String(value ?? 0)} className="font-display text-2xl font-bold text-cloud-100" />
            )}
            {!isLoading && <TrendIndicator trend={trend} />}
          </div>
          <div className="text-xs text-cloud-400">{label}</div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useDashboardStats()
  const navigate = useNavigate()

  let cardIndex = 0

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Overview of your catalog and activity." />

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
                  trend={data?.[`${card.key}Trend`]}
                  isLoading={isLoading}
                  delay={delay}
                />
              )
            })}
          </div>
        </div>
      ))}

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-cloud-600">Quick Actions</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.to}
              variant="secondary"
              icon={action.icon}
              onClick={() => navigate(action.to)}
              className="w-full justify-center"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
