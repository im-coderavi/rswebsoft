import { Sparkles, ArrowRight } from "lucide-react"
import Icon from "../ui/Icon"
import DeviceMockup from "./DeviceMockup"
import { heroStats } from "../../data/site"

function HeroStatCard({ item }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-ink-800/70 px-3.5 py-3 backdrop-blur transition hover:border-brand-500/40">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-gradient-soft text-brand-300">
        <Icon name={item.icon} size={18} />
      </span>
      <div className="leading-tight">
        <div className="font-display text-lg font-bold text-cloud-100">{item.value}</div>
        <div className="text-xs text-cloud-400">{item.label}</div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-brand-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full bg-accent-500/20 blur-[130px]" />

      <div className="container-rs relative grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-12 lg:py-20">
        {/* copy */}
        <div className="lg:col-span-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-200">
            <Sparkles size={13} /> 1500+ Premium Products
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-cloud-100 sm:text-5xl">
            Everything You Need to{" "}
            <span className="text-gradient">Build, Grow &amp; Automate</span>{" "}
            Your Digital Business
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-cloud-400">
            Premium WordPress Plugins, Themes, SaaS Tools, Source Codes &amp;
            Developer Resources – All in One Place.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95 glow-shadow">
              Browse All Products <ArrowRight size={17} />
            </button>
            <button className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-cloud-100 transition hover:bg-white/10">
              Explore Our Brands
            </button>
          </div>
        </div>

        {/* device */}
        <div className="lg:col-span-4">
          <DeviceMockup />
        </div>

        {/* stats column */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-3 lg:grid-cols-1">
          {heroStats.map((item) => (
            <HeroStatCard key={item.label} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
