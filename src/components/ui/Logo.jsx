import { Link } from "react-router-dom"

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient font-display text-lg font-extrabold text-white glow-shadow">
        RS
      </span>
      <span className="leading-none">
        <span className="block font-display text-lg font-bold tracking-tight text-cloud-100">
          RSWebSoft
        </span>
        {!compact && (
          <span className="hidden text-[11px] font-medium text-cloud-400 sm:block">
            Digital Ecosystem Platform
          </span>
        )}
      </span>
    </Link>
  )
}
