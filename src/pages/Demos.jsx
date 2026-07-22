import Icon from "../components/ui/Icon"
import { useDemoLinks } from "../hooks/useDemoLinks"

export default function Demos() {
  const { data: demoLinks, isLoading } = useDemoLinks()

  return (
    <div className="container-rs py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-cloud-100 sm:text-3xl">
          Demo Center
        </h1>
        <p className="mt-2 text-sm text-cloud-400">
          Try before you buy — explore live demos, docs, and samples of our products.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-ink-850" />
          ))}
        </div>
      )}

      {!isLoading && (!demoLinks || demoLinks.length === 0) && (
        <p className="py-10 text-center text-cloud-400">No demo links added yet.</p>
      )}

      {!isLoading && demoLinks?.length > 0 && (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {demoLinks.map((item) => (
            <a
              key={item._id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-2 rounded-xl border border-white/8 bg-ink-850/80 p-5 text-center backdrop-blur transition hover:-translate-y-0.5 hover:border-brand-500/40"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient-soft text-brand-300">
                <Icon name={item.icon} size={20} />
              </span>
              <span className="text-sm font-semibold text-cloud-100">{item.title}</span>
              <span className="text-[11px] text-cloud-400">{item.subtitle}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
