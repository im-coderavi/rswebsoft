import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

export default function SectionHeader({ title, linkLabel = "View All", to = "#" }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <h2 className="min-w-0 font-display text-xl font-bold tracking-tight text-cloud-100 sm:text-2xl sm:text-[28px]">
        {title}
      </h2>
      {linkLabel && (
        <Link
          to={to}
          className="group inline-flex shrink-0 items-center gap-1.5 self-start text-sm font-medium text-brand-300 transition hover:text-brand-200 sm:self-auto"
        >
          {linkLabel}
          <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}
