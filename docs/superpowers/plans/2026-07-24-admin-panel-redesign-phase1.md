# Admin Panel Redesign Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the shared design system (Button/Badge/EmptyState/Skeleton/PageHeader), a search+filter+sort-capable `DataTable`, a collapsible searchable sidebar, and a redesigned flagship Dashboard — proven on one real page (`CategoryList`) — without touching the other 14 admin pages.

**Architecture:** New shared primitives live in `src/admin/components/`. `DataTable` gains additive props (`searchable`, `searchKeys`, `filters`, per-column `sortable`) that existing callers can ignore. `AdminSidebar` gains client-side search + per-group collapse (persisted to `localStorage`). `Dashboard` and `CategoryList` are the only two pages that change behavior in this phase.

**Tech Stack:** React 19, Tailwind v4 (existing `--ink-*`/`--brand-*`/`--cloud-*` tokens in `src/index.css` — unchanged), lucide-react icons, framer-motion (already used in Dashboard), react-query (unchanged data layer).

## Global Constraints

- No new npm dependencies.
- lucide-react icons only — no emoji, anywhere (mockups or code).
- Reuse existing color tokens exactly (`ink-800`, `ink-850`, `brand-gradient`, `cloud-100/300/400/500`, `emerald`/`rose`/`amber` for status) — no new palette.
- "Comfortable" table density: row padding `py-3.5` (up from `py-3`).
- This repo has no automated test framework (no Jest/Vitest, no `*.test.js`, no `test` script in either `package.json`). Every task's verification is `vite build` (via `npx vite build --mode development`) plus a manual browser check — never skip the manual check, the build alone doesn't prove UI behavior.
- Do not modify `CategoryList`'s create/edit modal form, `ConfirmDialog`, `ImageUploader`, `useCategories.js`, or any backend/API code — out of scope for this phase.
- Do not modify any of the other 14 admin pages (Products, Orders, Brands, Customers, Demo Links, Subscribers, Settings, Homepage Sections, etc.) — out of scope for this phase.

---

### Task 1: `Button` component

**Files:**
- Create: `src/admin/components/Button.jsx`

**Interfaces:**
- Produces: default export `Button({ variant, icon, loading, iconOnly, className, children, disabled, ...rest })` — consumed by Task 5 (`PageHeader`), Task 8 (`Dashboard`), Task 9 (`CategoryList`).

- [ ] **Step 1: Create the component**

```jsx
import { Loader2 } from "lucide-react"

const VARIANT_CLASSES = {
  primary: "bg-brand-gradient text-white hover:opacity-95",
  secondary: "border border-white/10 text-cloud-300 hover:bg-white/5",
  ghost: "text-cloud-400 hover:bg-ink-800 hover:text-cloud-100",
  danger: "text-cloud-400 hover:bg-rose-500/15 hover:text-rose-400",
}

export default function Button({
  variant = "primary",
  icon: IconComp,
  loading = false,
  iconOnly = false,
  className = "",
  children,
  disabled,
  ...rest
}) {
  const shape = iconOnly
    ? "grid h-8 w-8 place-items-center rounded-lg"
    : "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"

  return (
    <button
      disabled={disabled || loading}
      className={`transition disabled:cursor-not-allowed disabled:opacity-60 ${shape} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconOnly ? 15 : 16} className="animate-spin" />
      ) : IconComp ? (
        <IconComp size={iconOnly ? 15 : 16} />
      ) : null}
      {!iconOnly && children}
    </button>
  )
}
```

- [ ] **Step 2: Verify the build succeeds**

Run (from repo root):
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors (component isn't imported anywhere yet, so this just confirms valid JSX/syntax).

- [ ] **Step 3: Commit**

```bash
git add src/admin/components/Button.jsx
git commit -m "feat: add shared admin Button component"
```

---

### Task 2: `Badge` component

**Files:**
- Create: `src/admin/components/Badge.jsx`

**Interfaces:**
- Produces: default export `Badge({ tone, children, className })` — `tone` one of `"success"|"neutral"|"danger"|"warning"|"brand"`. Not consumed by any task in this phase (built for Phase 2's status-pill migrations, e.g. order status, `HomeSectionList`'s Active/Hidden toggle) — included now so the full primitive set ships together per the design spec.

- [ ] **Step 1: Create the component**

```jsx
const TONE_CLASSES = {
  success: "bg-emerald-500/15 text-emerald-400",
  neutral: "bg-white/5 text-cloud-500",
  danger: "bg-rose-500/15 text-rose-400",
  warning: "bg-amber-500/15 text-amber-400",
  brand: "bg-brand-500/15 text-brand-300",
}

export default function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}>
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/admin/components/Badge.jsx
git commit -m "feat: add shared admin Badge component"
```

---

### Task 3: `EmptyState` component

**Files:**
- Create: `src/admin/components/EmptyState.jsx`

**Interfaces:**
- Produces: default export `EmptyState({ icon, title, description, action })` — consumed by Task 6 (`DataTable`).

- [ ] **Step 1: Create the component**

```jsx
export default function EmptyState({ icon: IconComp, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
      {IconComp && (
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-800 text-cloud-500">
          <IconComp size={22} />
        </span>
      )}
      <div>
        <p className="text-sm font-semibold text-cloud-200">{title}</p>
        {description && <p className="mt-1 text-xs text-cloud-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}
```

- [ ] **Step 2: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/admin/components/EmptyState.jsx
git commit -m "feat: add shared admin EmptyState component"
```

---

### Task 4: `Skeleton` component

**Files:**
- Create: `src/admin/components/Skeleton.jsx`

**Interfaces:**
- Produces: named exports `Skeleton({ className })` and `SkeletonRows({ columns, rows })` (renders `<tr>`/`<td>` elements — must be used inside a `<tbody>`). Consumed by Task 6 (`DataTable`).

- [ ] **Step 1: Create the component**

```jsx
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-ink-800 ${className}`} />
}

export function SkeletonRows({ columns = 4, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="px-4 py-3.5">
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
```

- [ ] **Step 2: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/admin/components/Skeleton.jsx
git commit -m "feat: add shared admin Skeleton loading component"
```

---

### Task 5: `PageHeader` component

**Files:**
- Create: `src/admin/components/PageHeader.jsx`

**Interfaces:**
- Consumes: `Button` (Task 1).
- Produces: default export `PageHeader({ title, description, action })` where `action` is `{ label, icon, onClick } | undefined`. Consumed by Task 8 (`Dashboard`), Task 9 (`CategoryList`).

- [ ] **Step 1: Create the component**

```jsx
import Button from "./Button"

export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-bold text-cloud-100">{title}</h1>
        {description && <p className="mt-1 text-sm text-cloud-400">{description}</p>}
      </div>
      {action && (
        <Button variant="primary" icon={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/admin/components/PageHeader.jsx
git commit -m "feat: add shared admin PageHeader component"
```

---

### Task 6: `DataTable` v2 — search, filter, sort, skeleton loading, empty state

**Files:**
- Modify: `src/admin/components/DataTable.jsx` (full rewrite of the file's contents)

**Interfaces:**
- Consumes: `EmptyState` (Task 3), `SkeletonRows` (Task 4).
- Produces: default export `DataTable({ columns, rows, keyField, loading, emptyMessage, emptyIcon, actions, searchable, searchKeys, filters })`. New props are additive — `searchable`/`searchKeys`/`filters` default to falsy/empty, and individual columns opt into sorting via `column.sortable: true`. Every existing caller (`ProductList`, `OrderList`, `BrandList`, `CustomerList`, `DemoLinkList`, `SubscriberList`, `HomeSectionList`, `TypedProductList`, `DeliveredWebsiteList`, `PackageList`) continues to work unchanged, but their loading/empty rows now render via `SkeletonRows`/`EmptyState` instead of plain text (an intentional visual improvement that applies immediately everywhere, per the design spec — this is the one part of Phase 1 that touches all pages, but only via this shared component, not by editing each page file).

- [ ] **Step 1: Replace the file contents**

```jsx
import { useMemo, useState } from "react"
import { Search, ChevronUp, ChevronDown } from "lucide-react"
import EmptyState from "./EmptyState"
import { SkeletonRows } from "./Skeleton"

export default function DataTable({
  columns,
  rows,
  keyField = "_id",
  loading,
  emptyMessage = "No records yet.",
  emptyIcon,
  actions,
  searchable = false,
  searchKeys = [],
  filters = [],
}) {
  const [query, setQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState({})
  const [sort, setSort] = useState({ key: null, direction: "asc" })

  const filteredRows = useMemo(() => {
    let result = rows

    if (searchable && query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter((row) =>
        searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(q))
      )
    }

    for (const [key, value] of Object.entries(activeFilters)) {
      if (!value) continue
      result = result.filter((row) => String(row[key]) === String(value))
    }

    if (sort.key) {
      result = [...result].sort((a, b) => {
        const av = a[sort.key]
        const bv = b[sort.key]
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        if (typeof av === "number" && typeof bv === "number") {
          return sort.direction === "asc" ? av - bv : bv - av
        }
        return sort.direction === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av))
      })
    }

    return result
  }, [rows, query, activeFilters, sort, searchable, searchKeys])

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    )
  }

  const columnCount = columns.length + (actions ? 1 : 0)
  const hasToolbar = searchable || filters.length > 0

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-ink-850">
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-2.5 border-b border-white/8 p-3.5">
          {searchable && (
            <div className="relative min-w-[180px] flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cloud-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-white/10 bg-ink-800 py-2 pl-9 pr-3 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>
          )}
          {filters.map((filter) => (
            <select
              key={filter.key}
              value={activeFilters[filter.key] || ""}
              onChange={(e) => setActiveFilters((f) => ({ ...f, [filter.key]: e.target.value }))}
              className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/8 text-xs uppercase tracking-wide text-cloud-500">
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                  {col.sortable ? (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 hover:text-cloud-300"
                    >
                      {col.label}
                      {sort.key === col.key ? (
                        sort.direction === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      ) : null}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && <SkeletonRows columns={columnCount} />}
            {!loading && filteredRows.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="p-0">
                  <EmptyState icon={emptyIcon} title={emptyMessage} />
                </td>
              </tr>
            )}
            {!loading &&
              filteredRows.map((row) => (
                <tr key={row[keyField]} className="transition hover:bg-ink-800/60">
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-3.5 text-cloud-200">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors. All 10 existing pages that import `DataTable` (`ProductList`, `OrderList`, `BrandList`, `CustomerList`, `DemoLinkList`, `SubscriberList`, `HomeSectionList`, `TypedProductList`, `DeliveredWebsiteList`, `PackageList`) must still compile since none of the removed/changed prop names (`columns`, `rows`, `keyField`, `loading`, `emptyMessage`, `actions`) were dropped.

- [ ] **Step 3: Manual verification — existing pages unaffected**

With the backend (`npm run server`) and frontend (`npm run dev`) dev servers running, log into `/admin` and open `/admin/brands` (or any other untouched list page): confirm the table still renders rows correctly, and toggle to a state with zero rows (or briefly throttle network in devtools) to confirm the loading state now shows pulsing skeleton rows instead of "Loading…" text, matching the new design.

- [ ] **Step 4: Commit**

```bash
git add src/admin/components/DataTable.jsx
git commit -m "feat: add search, filter, sort, and skeleton loading to DataTable"
```

---

### Task 7: Sidebar — search + collapsible groups

**Files:**
- Modify: `src/admin/layout/AdminSidebar.jsx` (full rewrite of the file's contents)

**Interfaces:**
- Consumes: `NAV_SECTIONS`, `resolveAdminPath` from `../navConfig` (unchanged).
- Produces: same default export `AdminSidebar({ open, onClose })` — no signature change, so `AdminLayout.jsx` needs no changes.

- [ ] **Step 1: Replace the file contents**

```jsx
import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { X, Search, ChevronDown } from "lucide-react"
import Logo from "../../components/ui/Logo"
import { NAV_SECTIONS, resolveAdminPath } from "../navConfig"

const STORAGE_KEY = "rs_admin_sidebar_state"

function loadCollapsedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCollapsedState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore write failures (private browsing, storage disabled, etc.)
  }
}

export default function AdminSidebar({ open, onClose }) {
  const location = useLocation()
  const effectivePath = resolveAdminPath(location.pathname, location.search)
  const [query, setQuery] = useState("")
  const [collapsed, setCollapsed] = useState(() => loadCollapsedState())

  useEffect(() => {
    saveCollapsedState(collapsed)
  }, [collapsed])

  function toggleGroup(label) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const q = query.trim().toLowerCase()
  const filteredSections = q
    ? NAV_SECTIONS.map((section) => ({
        ...section,
        links: section.links.filter((link) => link.label.toLowerCase().includes(q)),
      })).filter((section) => section.links.length > 0)
    : NAV_SECTIONS

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
        <div className="border-b border-white/8 p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cloud-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu..."
              className="w-full rounded-lg border border-white/10 bg-ink-800 py-2 pl-9 pr-3 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            />
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 py-4">
          {filteredSections.length === 0 && (
            <p className="px-3.5 text-sm text-cloud-500">No matching pages</p>
          )}
          {filteredSections.map((section) => {
            const isCollapsed = Boolean(collapsed[section.label]) && !q
            return (
              <div key={section.label} className="mb-4">
                <button
                  onClick={() => toggleGroup(section.label)}
                  className="mb-1.5 flex w-full items-center justify-between px-3.5 text-[10px] font-bold uppercase tracking-widest text-cloud-600 hover:text-cloud-400"
                >
                  {section.label}
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                  />
                </button>
                {!isCollapsed && (
                  <div className="space-y-1">
                    {section.links.map(({ to, label, icon: Icon, end }) => {
                      const isActive = end
                        ? effectivePath === to
                        : effectivePath === to || effectivePath.startsWith(`${to}/`)
                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={onClose}
                          className={[
                            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                            isActive
                              ? "bg-brand-gradient text-white glow-shadow"
                              : "text-cloud-400 hover:bg-ink-800 hover:text-cloud-100",
                          ].join(" ")}
                        >
                          <Icon size={18} />
                          {label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <div className="border-t border-white/8 p-4 text-xs text-cloud-500">
          RSWebSoft Admin Panel
        </div>
      </aside>
    </>
  )
}
```

- [ ] **Step 2: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 3: Manual verification**

With both dev servers running, log into `/admin`:
1. Type "product" into the sidebar search box — confirm only matching links (e.g. "Products") remain visible, other groups disappear.
2. Clear the search — confirm the full nav returns.
3. Click a group label (e.g. "CATALOG") — confirm its links collapse (chevron rotates), click again to re-expand.
4. Reload the page — confirm the collapsed/expanded state from step 3 persisted.
5. Confirm the currently active page's link still highlights correctly (e.g. navigate to `/admin/categories`, confirm "Categories" is highlighted).

- [ ] **Step 4: Commit**

```bash
git add src/admin/layout/AdminSidebar.jsx
git commit -m "feat: add search and collapsible groups to admin sidebar"
```

---

### Task 8: Dashboard redesign — PageHeader, trend indicators, quick actions

**Files:**
- Modify: `src/admin/pages/Dashboard.jsx` (full rewrite of the file's contents)

**Interfaces:**
- Consumes: `PageHeader` (Task 5), `Button` (Task 1), `useDashboardStats` (unchanged, `src/hooks/useDashboardStats.js`).
- No changes to `useDashboardStats` or the backend `/api/dashboard/stats` endpoint — trend arrows render only when the payload happens to include a `<key>Trend` numeric field; today's API doesn't send one, so no trend arrows appear yet (expected, not a bug).

- [ ] **Step 1: Replace the file contents**

```jsx
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
```

- [ ] **Step 2: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 3: Manual verification**

With both dev servers running, log into `/admin` (lands on Dashboard):
1. Confirm the page shows a "Dashboard" heading with the description text below it (via `PageHeader`), then the 3 stat clusters as before, then a new "Quick Actions" row of 3 buttons.
2. Confirm no trend arrows appear (since the API doesn't send `<key>Trend` fields yet) and nothing is broken by their absence.
3. Click each Quick Action button — confirm "Add Product" navigates to `/admin/products/new`, "New Homepage Section" navigates to `/admin/sections`, "New Category" navigates to `/admin/categories`.

- [ ] **Step 4: Commit**

```bash
git add src/admin/pages/Dashboard.jsx
git commit -m "feat: redesign Dashboard with PageHeader, trend indicators, and quick actions"
```

---

### Task 9: `CategoryList` migration — proof of `DataTable` v2 + shared primitives

**Files:**
- Modify: `src/admin/pages/categories/CategoryList.jsx`

**Interfaces:**
- Consumes: `PageHeader` (Task 5), `Button` (Task 1), `DataTable`'s new `searchable`/`searchKeys` props and per-column `sortable` (Task 6).
- No changes to the create/edit modal form or `ConfirmDialog` usage — only the page header and the row-action buttons change.

- [ ] **Step 1: Replace the header and action-button sections**

In `src/admin/pages/categories/CategoryList.jsx`, add two imports alongside the existing ones:
```jsx
import PageHeader from "../../components/PageHeader"
import Button from "../../components/Button"
```

Change the `productCount` column definition from:
```jsx
    { key: "productCount", label: "Products" },
```
to:
```jsx
    { key: "productCount", label: "Products", sortable: true },
```

Replace:
```jsx
  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
        >
          <Plus size={16} /> New Category
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={categories || []}
        loading={isLoading}
        emptyMessage="No categories yet."
        actions={(c) => (
          <>
            <button
              onClick={() => openEdit(c)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100"
              aria-label="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setPendingDelete(c)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-rose-500/15 hover:text-rose-400"
              aria-label="Delete"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      />
```
with:
```jsx
  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your catalog into browsable categories."
        action={{ label: "New Category", icon: Plus, onClick: openCreate }}
      />

      <DataTable
        columns={columns}
        rows={categories || []}
        loading={isLoading}
        emptyMessage="No categories yet."
        searchable
        searchKeys={["name", "slug"]}
        actions={(c) => (
          <>
            <Button variant="ghost" iconOnly icon={Pencil} onClick={() => openEdit(c)} aria-label="Edit" />
            <Button variant="danger" iconOnly icon={Trash2} onClick={() => setPendingDelete(c)} aria-label="Delete" />
          </>
        )}
      />
```

Leave everything else in the file (the modal form, `ConfirmDialog`, all state/handlers) unchanged.

- [ ] **Step 2: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 3: Manual verification**

With both dev servers running, log into `/admin` and open `/admin/categories`:
1. Confirm the page now shows the new `PageHeader` layout (title + description on the left, "New Category" button on the right) instead of the old bare button row.
2. Type a partial category name into the new search box above the table — confirm the list filters to matching rows only; clear it and confirm the full list returns.
3. Click the "Products" column header — confirm rows sort ascending by product count; click again — confirm descending.
4. Click the Edit icon on a row — confirm the edit modal still opens with correct pre-filled values, and saving still works.
5. Click the Delete icon on a category with 0 products — confirm the confirm dialog still opens and deletion still works (create a throwaway test category first if none with 0 products is safe to delete).

- [ ] **Step 4: Commit**

```bash
git add src/admin/pages/categories/CategoryList.jsx
git commit -m "feat: migrate CategoryList onto PageHeader, Button, and DataTable v2"
```

---

### Task 10: Full end-to-end walkthrough

**Files:** none (verification-only task).

- [ ] **Step 1: Full regression pass**

With both dev servers running, log into `/admin` and walk through:
1. Dashboard — stat cards, quick actions (Task 8's checks).
2. Sidebar — search, collapse/expand, persistence (Task 7's checks).
3. Categories — new header, search, sort, edit, delete (Task 9's checks).
4. Every other admin page still loads without errors: `/admin/products`, `/admin/delivered-websites`, `/admin/packages`, `/admin/brands`, `/admin/orders`, `/admin/customers`, `/admin/demo-links`, `/admin/subscribers`, `/admin/sections`, `/admin/settings` — confirm each renders its list/table (now with skeleton loading and `EmptyState` styling from Task 6, otherwise unchanged) with no console errors.

- [ ] **Step 2: Final build check**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: clean build, no errors.

- [ ] **Step 3: Commit (if any leftover changes)**

```bash
git status
```
If clean, no commit needed — this task is verification-only and should produce no code changes beyond what Tasks 1–9 already committed.
