import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import SectionHeader from "../ui/SectionHeader"
import Icon from "../ui/Icon"
import { toneGradient } from "../../lib/tones"
import { useCategories } from "../../hooks/useCategories"

const MotionLink = motion.create(Link)
const DISPLAY_LIMIT = 14

export default function CategoriesGrid() {
  const { data: categories, isLoading } = useCategories()
  const shown = (categories || []).slice(0, DISPLAY_LIMIT)

  return (
    <section className="container-rs py-12">
      <SectionHeader title="Explore Our Top Categories" linkLabel="View All Categories" to="/products" />
      {isLoading ? (
        <p className="text-sm text-cloud-500">Loading categories…</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-5">
          {shown.map((cat, i) => (
            <MotionLink
              key={cat._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: (i % 15) * 0.04, ease: [0.21, 0.47, 0.32, 0.98] }}
              to={`/products?category=${cat._id}`}
              className="group flex min-w-0 items-center gap-2 rounded-xl border border-white/8 bg-ink-850 p-2.5 transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-ink-800 sm:gap-3 sm:p-3.5"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-lg transition group-hover:scale-105 sm:h-11 sm:w-11"
                style={toneGradient(cat.tone)}
              >
                <Icon name={cat.icon} size={18} className="sm:hidden" />
                <Icon name={cat.icon} size={20} className="hidden sm:block" />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-xs font-semibold text-cloud-100 sm:text-sm">{cat.name}</span>
                <span className="block truncate text-[11px] text-cloud-400 sm:text-xs">{cat.productCount} Products</span>
              </span>
            </MotionLink>
          ))}
          <MotionLink
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (shown.length % 15) * 0.04, ease: [0.21, 0.47, 0.32, 0.98] }}
            to="/products"
            className="group flex min-w-0 items-center gap-2 rounded-xl border border-white/8 bg-ink-850 p-2.5 transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-ink-800 sm:gap-3 sm:p-3.5"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-lg transition group-hover:scale-105 sm:h-11 sm:w-11">
              <Icon name="LayoutGrid" size={18} className="sm:hidden" />
              <Icon name="LayoutGrid" size={20} className="hidden sm:block" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-xs font-semibold text-cloud-100 sm:text-sm">More Categories</span>
              <span className="block truncate text-[11px] text-cloud-400 sm:text-xs">View All</span>
            </span>
          </MotionLink>
        </div>
      )}
    </section>
  )
}
