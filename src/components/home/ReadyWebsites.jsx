import SectionHeader from "../ui/SectionHeader"
import Icon from "../ui/Icon"
import { toneGradient } from "../../lib/tones"
import { readyWebsites } from "../../data/site"

const iconFor = {
  "Restaurant Kit": "UtensilsCrossed",
  "School Management": "GraduationCap",
  "Hospital & Clinic": "Stethoscope",
  "Gym & Fitness": "Dumbbell",
  "Real Estate": "Building2",
  "Portfolio Agency": "Briefcase",
}

export default function ReadyWebsites() {
  return (
    <section className="container-rs py-8">
      <SectionHeader title="Ready Websites" to="/ready-websites" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {readyWebsites.map((site) => (
          <div
            key={site.name}
            className="group overflow-hidden rounded-2xl border border-white/8 bg-ink-850 transition hover:-translate-y-1 hover:border-brand-500/40"
          >
            <div className="relative aspect-[4/3] overflow-hidden" style={toneGradient(site.tone, 150)}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(255,255,255,0.22),transparent_50%)]" />
              <span className="absolute left-2.5 top-2.5 rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                {site.pages}
              </span>
              <span className="absolute bottom-2.5 right-2.5 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-bold text-ink-900">
                ${site.price}
              </span>
              <div className="absolute inset-0 grid place-items-center text-white/90 transition group-hover:scale-110">
                <Icon name={iconFor[site.name]} size={38} />
              </div>
            </div>
            <div className="flex items-center justify-between p-3.5">
              <span className="truncate text-sm font-semibold text-cloud-100">{site.name}</span>
              <span className="font-display text-sm font-bold text-brand-300">${site.price}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
