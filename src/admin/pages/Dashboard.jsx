import { motion, useReducedMotion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { ArrowUpRight, ArrowDownRight, Plus, ArrowRight, Check } from "lucide-react"
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts"
import { useDashboardStats, useDashboardAnalytics } from "../../hooks/useDashboardStats"
import { formatINR } from "../../lib/currency"
import PageHeader from "../components/PageHeader"

// The admin here is the shop owner, so the page is ordered by what they can act
// on: money first, then anything a customer is waiting for, then what's selling.
// Colour only ever carries meaning — brand for money, amber for waiting,
// emerald for done, rose for cancelled. Nothing is tinted for decoration.
const PIPELINE = [
  { status: "fulfilled", label: "delivered", color: "#34d399" },
  { status: "paid", label: "paid", color: "#6366f1" },
  { status: "pending", label: "unpaid", color: "#fbbf24" },
  { status: "cancelled", label: "cancelled", color: "#fb7185" },
]

function Eyebrow({ children, className = "" }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-cloud-500 ${className}`}>
      {children}
    </p>
  )
}

function Panel({ children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-ink-800 bg-ink-850 ${className}`}>{children}</section>
  )
}

function Delta({ value }) {
  if (value == null || value === 0) return null
  const up = value > 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${up ? "text-status-ok" : "text-status-bad"}`}>
      <Icon size={15} />
      {Math.abs(value)}%
      <span className="font-normal text-cloud-500">this week</span>
    </span>
  )
}

function EarningsBand({ stats, analytics, loading }) {
  const trend = analytics?.revenueTrend || []
  const earned = trend.reduce((sum, d) => sum + d.revenue, 0)
  const points = trend.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  }))
  const hasMovement = points.some((p) => p.revenue > 0)

  return (
    <Panel className="overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="p-6 sm:p-7">
          <Eyebrow>Earned · last 30 days</Eyebrow>
          {loading ? (
            <div className="mt-3 h-14 w-52 animate-pulse rounded-lg bg-ink-800" />
          ) : (
            <p className="mt-2.5 font-display text-5xl font-bold leading-none tracking-tight text-cloud-100 tabular-nums sm:text-6xl">
              {formatINR(earned)}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-cloud-500 tabular-nums">
            <Delta value={stats?.revenueTrend} />
            {stats?.revenueTrend ? <span className="text-cloud-500/40">·</span> : null}
            <span>{formatINR(stats?.revenue ?? 0)} all time across {stats?.orders ?? 0} orders</span>
          </div>
        </div>

        {/* Bleeds to the card edges on purpose — the number states the amount,
            the curve states the shape. Axes would be false precision here. */}
        <div className="relative min-h-[132px] lg:min-h-[184px]">
          {loading ? (
            <div className="absolute inset-4 animate-pulse rounded-lg bg-ink-800" />
          ) : hasMovement ? (
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    cursor={{ stroke: "rgba(129,140,248,0.45)", strokeWidth: 1 }}
                    contentStyle={{
                      background: "var(--ink-800)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 10,
                      fontSize: 12,
                      padding: "8px 10px",
                    }}
                    labelStyle={{ color: "var(--cloud-400)", marginBottom: 2 }}
                    formatter={(v) => [formatINR(v), "Earned"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#818cf8"
                    strokeWidth={2}
                    fill="url(#earned)"
                    activeDot={{ r: 4, fill: "#818cf8", stroke: "var(--ink-850)", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid h-full place-items-center px-6 pb-6 text-sm text-cloud-500 lg:pb-0">
              No sales in the last 30 days.
            </div>
          )}
        </div>
      </div>

      <PipelineBar analytics={analytics} loading={loading} />
    </Panel>
  )
}

function PipelineBar({ analytics, loading }) {
  const counts = new Map((analytics?.statusBreakdown || []).map((s) => [s.status, s.count]))
  const segments = PIPELINE.map((p) => ({ ...p, count: counts.get(p.status) || 0 })).filter((p) => p.count > 0)
  const total = segments.reduce((sum, s) => sum + s.count, 0)

  if (loading || total === 0) return null

  return (
    <div className="border-t border-ink-800 px-6 py-4 sm:px-7">
      <div className="flex h-1.5 gap-1 overflow-hidden rounded-full">
        {segments.map((s) => (
          <div key={s.status} style={{ flexGrow: s.count, background: s.color }} className="rounded-full" />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s) => (
          <span key={s.status} className="flex items-center gap-2 text-xs text-cloud-400 tabular-nums">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
            {s.count} {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function NeedsYou({ stats, analytics, loading }) {
  const counts = new Map((analytics?.statusBreakdown || []).map((s) => [s.status, s.count]))
  const drafts = Math.max(0, (stats?.products ?? 0) - (stats?.publishedProducts ?? 0))

  const items = [
    { count: counts.get("paid") || 0, label: "paid, waiting for delivery", to: "/admin/orders", urgent: true },
    { count: counts.get("pending") || 0, label: "waiting on payment", to: "/admin/orders" },
    { count: drafts, label: "products still in draft", to: "/admin/products" },
  ]
  const open = items.filter((i) => i.count > 0)

  return (
    <Panel className="p-6">
      <div className="flex items-center justify-between">
        <Eyebrow>Needs you</Eyebrow>
        {!loading && open.length > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-500/15 px-1.5 text-[11px] font-bold text-status-warn tabular-nums">
            {open.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-ink-800" />)}
        </div>
      ) : open.length === 0 ? (
        <div className="mt-5 flex items-center gap-2.5 text-sm text-cloud-400">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/15 text-status-ok">
            <Check size={14} />
          </span>
          Nothing waiting. All orders are delivered.
        </div>
      ) : (
        <ul className="mt-4 -mx-2">
          {open.map((item) => (
            <li key={item.label}>
              <Link
                to={item.to}
                className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-ink-800"
              >
                <span className={`font-display text-xl font-bold tabular-nums ${item.urgent ? "text-status-warn" : "text-cloud-100"}`}>
                  {item.count}
                </span>
                <span className="flex-1 text-sm text-cloud-400">{item.label}</span>
                <ArrowRight size={14} className="text-cloud-500 opacity-0 transition group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

const STATUS_TEXT = {
  fulfilled: "text-status-ok",
  paid: "text-status-info",
  pending: "text-status-warn",
  cancelled: "text-status-bad",
}

function RecentOrders({ orders, loading }) {
  return (
    <Panel className="p-6">
      <div className="flex items-center justify-between">
        <Eyebrow>Recent orders</Eyebrow>
        <Link to="/admin/orders" className="text-xs font-semibold text-brand-300 transition hover:text-brand-200">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-ink-800" />)}
        </div>
      ) : !orders?.length ? (
        <p className="mt-5 text-sm text-cloud-500">No orders yet. They'll show up here as they come in.</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink-800">
          {orders.map((o) => (
            <li
              key={o.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 py-2.5 sm:grid-cols-[minmax(0,1fr)_5.5rem_6rem_5.5rem]"
            >
              <span className="truncate text-sm text-cloud-300">{o.customerName}</span>
              <span className="hidden text-xs text-cloud-500 tabular-nums sm:block">
                {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
              <span className={`hidden text-xs font-medium capitalize sm:block ${STATUS_TEXT[o.status] || "text-cloud-500"}`}>
                {o.status}
              </span>
              <span className="text-right text-sm font-semibold text-cloud-100 tabular-nums">
                {formatINR(o.total)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function TopSellers({ products, loading }) {
  const max = products?.[0]?.revenue || 1

  return (
    <Panel className="p-6">
      <Eyebrow>Moving · top sellers by revenue</Eyebrow>

      {loading ? (
        <div className="mt-5 space-y-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-ink-800" />)}
        </div>
      ) : !products?.length ? (
        <p className="mt-5 text-sm text-cloud-500">Nothing sold yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {products.map((p) => (
            <li key={p.id}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="truncate text-sm text-cloud-300">{p.name}</span>
                <span className="shrink-0 text-sm font-semibold text-cloud-100 tabular-nums">
                  {formatINR(p.revenue)}
                  <span className="ml-2 font-normal text-cloud-500">{p.qty} sold</span>
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-800">
                <div
                  className="h-full rounded-full bg-brand-400"
                  style={{ width: `${Math.max(3, Math.round((p.revenue / max) * 100))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function CatalogStrip({ stats, loading }) {
  if (loading) return <div className="h-5 w-80 animate-pulse rounded bg-ink-850" />

  const facts = [
    [stats?.products, "products"],
    [stats?.publishedProducts, "published"],
    [stats?.categories, "categories"],
    [stats?.brands, "brands"],
    [stats?.customers, "customers"],
    [stats?.subscribers, "subscribers"],
  ]

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-1">
      <p className="flex flex-wrap items-center gap-x-2 text-sm text-cloud-500 tabular-nums">
        {facts.map(([value, label], i) => (
          <span key={label}>
            {i > 0 && <span className="mr-2 text-cloud-500/40">·</span>}
            <span className="font-semibold text-cloud-300">{value ?? 0}</span> {label}
          </span>
        ))}
      </p>
      <Link to="/admin/products" className="text-xs font-semibold text-brand-300 transition hover:text-brand-200">
        Manage catalog
      </Link>
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  const loading = statsLoading || analyticsLoading

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="space-y-4"
    >
      <PageHeader
        title="Dashboard"
        description={new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        action={{ label: "New product", icon: Plus, onClick: () => navigate("/admin/products/new") }}
      />

      <EarningsBand stats={stats} analytics={analytics} loading={loading} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <NeedsYou stats={stats} analytics={analytics} loading={loading} />
        <TopSellers products={analytics?.topProducts} loading={loading} />
      </div>

      <RecentOrders orders={analytics?.recentOrders} loading={loading} />

      <div className="pt-2">
        <CatalogStrip stats={stats} loading={statsLoading} />
      </div>
    </motion.div>
  )
}
