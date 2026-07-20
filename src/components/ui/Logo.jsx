import { Link } from "react-router-dom"

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient font-display text-base font-extrabold text-white glow-shadow sm:h-10 sm:w-10 sm:text-lg">
        RS
      </span>
      <span className="leading-none">
        <span className="block whitespace-nowrap font-display text-base font-bold tracking-tight text-cloud-100 sm:text-lg">
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
