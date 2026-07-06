import Icon from "../ui/Icon"
import { statStrip } from "../../data/site"

export default function StatsStrip() {
  return (
    <section className="container-rs -mt-4 pb-4">
      <div className="grid grid-cols-2 gap-y-6 rounded-2xl border border-white/8 bg-ink-850/80 px-6 py-6 backdrop-blur sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-white/8">
        {statStrip.map((item) => (
          <div key={item.label} className="flex items-center gap-3 px-2 lg:justify-center">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-gradient-soft text-brand-300">
              <Icon name={item.icon} size={18} />
            </span>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold text-cloud-100">{item.value}</div>
              <div className="text-xs text-cloud-400">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
