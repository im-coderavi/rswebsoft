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
