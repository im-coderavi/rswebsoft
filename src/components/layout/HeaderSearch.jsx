import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Search, ChevronDown, Check, Grid3x3 } from "lucide-react"
import Icon from "../ui/Icon"
import { toneGradient } from "../../lib/tones"
import { useCategories } from "../../hooks/useCategories"

export default function HeaderSearch() {
  const navigate = useNavigate()
  const { data: categories = [] } = useCategories()
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    function onMouseDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  const selected = categories.find((c) => c._id === categoryId)

  function submit() {
    const params = new URLSearchParams()
    const q = search.trim()
    if (q) params.set("search", q)
    if (categoryId) params.set("category", categoryId)
    const qs = params.toString()
    navigate(qs ? `/products?${qs}` : "/products")
    setOpen(false)
  }

  function pickCategory(id) {
    setCategoryId(id === categoryId ? "" : id)
    setOpen(false)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="ml-2 hidden max-w-[560px] flex-1 items-center rounded-xl border border-white/10 bg-ink-800 focus-within:border-brand-500/60 lg:flex"
    >
      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex shrink-0 items-center gap-1.5 border-r border-white/10 px-4 py-2.5 text-sm font-medium text-cloud-300 transition hover:text-cloud-100"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {selected ? (
            <>
              <span
                className="grid h-5 w-5 shrink-0 place-items-center rounded text-white"
                style={toneGradient(selected.tone)}
              >
                <Icon name={selected.icon} size={11} />
              </span>
              <span className="max-w-[120px] truncate">{selected.name}</span>
            </>
          ) : (
            <span>All Categories</span>
          )}
          <ChevronDown
            size={15}
            className={["transition-transform", open ? "rotate-180" : ""].join(" ")}
          />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-ink-900 shadow-2xl">
            <div className="max-h-80 overflow-y-auto p-1.5">
              <button
                type="button"
                onClick={() => pickCategory("")}
                className={[
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition",
                  !categoryId
                    ? "bg-ink-800 text-cloud-100"
                    : "text-cloud-300 hover:bg-ink-800 hover:text-cloud-100",
                ].join(" ")}
                role="option"
                aria-selected={!categoryId}
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink-800 text-brand-300">
                  <Grid3x3 size={14} />
                </span>
                <span className="flex-1 font-medium">All Categories</span>
                {!categoryId && <Check size={15} className="text-brand-400" />}
              </button>
              {categories.length > 0 && (
                <div className="my-1 border-t border-white/5" />
              )}
              {categories.map((cat) => {
                const active = categoryId === cat._id
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => pickCategory(cat._id)}
                    className={[
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition",
                      active
                        ? "bg-ink-800 text-cloud-100"
                        : "text-cloud-300 hover:bg-ink-800 hover:text-cloud-100",
                    ].join(" ")}
                    role="option"
                    aria-selected={active}
                  >
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white"
                      style={toneGradient(cat.tone)}
                    >
                      <Icon name={cat.icon} size={14} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                    {cat.productCount != null && (
                      <span className="text-[11px] text-cloud-500">{cat.productCount}</span>
                    )}
                    {active && <Check size={15} className="text-brand-400" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search for products, themes, plugins, tools..."
        className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:outline-none"
      />

      <button
        type="submit"
        aria-label="Search"
        className="m-1 grid h-9 w-10 shrink-0 place-items-center rounded-lg bg-brand-gradient text-white transition hover:opacity-95"
      >
        <Search size={18} />
      </button>
    </form>
  )
}
