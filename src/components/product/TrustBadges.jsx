import { ShieldCheck, Zap, BadgeCheck } from "lucide-react"

const badges = [
  { icon: ShieldCheck, label: "Secure UPI Payment" },
  { icon: Zap, label: "Instant Access" },
  { icon: BadgeCheck, label: "Verified Product" },
]

export default function TrustBadges() {
  return (
    <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-white/8 bg-ink-850/60 p-3">
      {badges.map(({ icon: Icon, label }) => (
        <div key={label} className="flex flex-col items-center gap-1.5 text-center">
          <Icon size={17} className="text-brand-300" />
          <span className="text-[11px] leading-tight text-cloud-400">{label}</span>
        </div>
      ))}
    </div>
  )
}
