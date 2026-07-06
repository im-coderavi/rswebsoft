import { useRef } from "react"
import { MessageSquareQuote, ChevronLeft, ChevronRight } from "lucide-react"
import { StarRow } from "../ui/StarRating"
import { toneGradient } from "../../lib/tones"
import { testimonials } from "../../data/site"

const avatarTones = ["violet", "pink", "sky", "emerald"]

export default function Testimonials() {
  const trackRef = useRef(null)
  const nudge = (dir) => {
    const el = trackRef.current
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.6), behavior: "smooth" })
  }

  return (
    <section className="container-rs py-8">
      <div className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-brand-gradient-soft p-6 sm:p-8">
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-accent-500/15 blur-3xl" />
        <div className="relative mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white">
            <MessageSquareQuote size={20} />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-cloud-100">
              What Our Customers Say
            </h2>
            <p className="text-sm text-cloud-400">Trusted by 1000+ customers worldwide</p>
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <button
            onClick={() => nudge(-1)}
            aria-label="Previous"
            className="hidden h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 bg-ink-850 text-cloud-300 transition hover:text-cloud-100 sm:grid"
          >
            <ChevronLeft size={18} />
          </button>

          <div
            ref={trackRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto"
          >
            {testimonials.map((t, i) => (
              <figure
                key={t.name}
                className="w-[calc(100%-0rem)] shrink-0 snap-start rounded-xl border border-white/8 bg-ink-850/80 p-5 backdrop-blur sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full font-display text-sm font-bold text-white"
                    style={toneGradient(avatarTones[i % avatarTones.length])}
                  >
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                  <figcaption className="leading-tight">
                    <div className="text-sm font-semibold text-cloud-100">{t.name}</div>
                    <div className="text-xs text-cloud-400">{t.role}</div>
                  </figcaption>
                </div>
                <StarRow rating={t.rating} />
                <blockquote className="mt-3 text-sm leading-relaxed text-cloud-300">
                  “{t.quote}”
                </blockquote>
              </figure>
            ))}
          </div>

          <button
            onClick={() => nudge(1)}
            aria-label="Next"
            className="hidden h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 bg-ink-850 text-cloud-300 transition hover:text-cloud-100 sm:grid"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}
