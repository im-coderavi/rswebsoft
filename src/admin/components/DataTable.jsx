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
