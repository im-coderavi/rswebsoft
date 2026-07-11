import { ShieldCheck, Zap, BadgeCheck, Headphones } from "lucide-react"
import { RevealGroup, RevealItem } from "../ui/Reveal"

const points = [
  {
    icon: ShieldCheck,
    title: "Secure UPI Payments",
    desc: "Pay safely via UPI QR — no card details ever stored on our site.",
  },
  {
    icon: Zap,
    title: "Fast Delivery",
    desc: "Get your download link shortly after payment is verified.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Products",
    desc: "Every product is tested and quality-checked before listing.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    desc: "Real help from a real team whenever you get stuck.",
  },
]

export default function WhyChooseUs() {
  return (
    <section className="container-rs py-8">
      <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {points.map(({ icon: Icon, title, desc }) => (
          <RevealItem
            key={title}
            className="rounded-2xl border border-white/8 bg-ink-850 p-6 transition hover:-translate-y-0.5 hover:border-brand-500/40"
          >
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient-soft text-brand-300">
              <Icon size={22} />
            </span>
            <h3 className="mb-1.5 text-sm font-bold text-cloud-100">{title}</h3>
            <p className="text-xs leading-relaxed text-cloud-400">{desc}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  )
}
