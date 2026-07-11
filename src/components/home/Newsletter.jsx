import { Mail } from "lucide-react"
import Reveal from "../ui/Reveal"

export default function Newsletter() {
  return (
    <section className="container-rs py-8">
      <Reveal className="relative overflow-hidden rounded-2xl border border-brand-500/25 bg-brand-gradient-soft p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-600/25 blur-3xl" />
        <div className="relative flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white glow-shadow">
              <Mail size={24} />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-cloud-100 sm:text-2xl">
                Stay Updated with RSWebSoft
              </h2>
              <p className="mt-1 max-w-lg text-sm text-cloud-400">
                Subscribe to our newsletter and get exclusive offers, new product
                updates and amazing discounts straight to your inbox.
              </p>
            </div>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-ink-850 p-1.5 lg:w-auto"
          >
            <input
              type="email"
              required
              placeholder="Enter your email address"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-cloud-100 placeholder:text-cloud-500 focus:outline-none lg:w-72"
            />
            <button className="shrink-0 rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95">
              Subscribe Now
            </button>
          </form>
        </div>
      </Reveal>
    </section>
  )
}
