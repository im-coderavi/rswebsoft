import { LogOut, ExternalLink, Menu } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

export default function AdminTopbar({ title, onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/admin/login", { replace: true })
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/8 bg-ink-900/80 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="grid h-9 w-9 place-items-center rounded-lg text-cloud-300 hover:bg-ink-800 hover:text-cloud-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg font-bold text-cloud-100">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 text-sm text-cloud-400 transition hover:text-cloud-100 sm:flex"
        >
          View site <ExternalLink size={14} />
        </a>
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-sm font-semibold text-cloud-100">{user?.name}</div>
          <div className="text-xs text-cloud-500">{user?.email}</div>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">
          {user?.name?.[0]?.toUpperCase() || "A"}
        </span>
        <button
          onClick={handleLogout}
          className="grid h-9 w-9 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-rose-400"
          aria-label="Log out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  )
}
