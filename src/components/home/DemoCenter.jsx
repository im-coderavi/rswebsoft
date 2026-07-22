import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import Icon from "../ui/Icon"
import { useDemoLinks } from "../../hooks/useDemoLinks"
import Reveal, { RevealGroup, RevealItem } from "../ui/Reveal"

export default function DemoCenter() {
  const { data: demoLinks, isLoading } = useDemoLinks()

  if (!isLoading && (!demoLinks || demoLinks.length === 0)) return null

  return (
    <section className="container-rs py-8">
      <Reveal className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-brand-gradient-soft p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-cloud-100">Demo Center</h2>
            <p className="mt-1 text-sm text-cloud-400">
              Try before you buy — explore live demos of our products
            </p>
          </div>
          <Link
            to="/demos"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand-300 transition hover:text-brand-200"
          >
            View All Demos <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </Link>
        </div>
        <RevealGroup className="relative grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-ink-850/80" />
              ))
            : demoLinks.slice(0, 6).map((item) => (
                <RevealItem key={item._id}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-2 rounded-xl border border-white/8 bg-ink-850/80 p-4 text-center backdrop-blur transition hover:-translate-y-0.5 hover:border-brand-500/40"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient-soft text-brand-300">
                      <Icon name={item.icon} size={20} />
                    </span>
                    <span className="text-sm font-semibold text-cloud-100">{item.title}</span>
                    <span className="text-[11px] text-cloud-400">{item.subtitle}</span>
                  </a>
                </RevealItem>
              ))}
        </RevealGroup>
      </Reveal>
    </section>
  )
}
