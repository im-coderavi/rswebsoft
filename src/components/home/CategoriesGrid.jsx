import SectionHeader from "../ui/SectionHeader"
import Icon from "../ui/Icon"
import { toneGradient } from "../../lib/tones"
import { categories } from "../../data/site"

export default function CategoriesGrid() {
  return (
    <section className="container-rs py-12">
      <SectionHeader title="Explore Our Top Categories" linkLabel="View All Categories" to="/categories" />
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => (
          <a
            key={cat.name}
            href="#"
            className="group flex items-center gap-3 rounded-xl border border-white/8 bg-ink-850 p-3.5 transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-ink-800"
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-lg transition group-hover:scale-105"
              style={toneGradient(cat.tone)}
            >
              <Icon name={cat.icon} size={20} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold text-cloud-100">{cat.name}</span>
              <span className="block text-xs text-cloud-400">{cat.count}</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
