import { NavLink } from "react-router-dom"
import { ChevronDown } from "lucide-react"
import { navLinks } from "../../data/site"

export default function Navbar() {
  return (
    <nav className="border-b border-white/5 bg-ink-900/95">
      <div className="container-rs flex h-12 items-center gap-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.label}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition",
                isActive ? "text-cloud-100" : "text-cloud-400 hover:text-cloud-100",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {link.label}
                {link.dropdown && <ChevronDown size={14} className="opacity-70" />}
                <span
                  className={[
                    "absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-gradient transition",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                  ].join(" ")}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
