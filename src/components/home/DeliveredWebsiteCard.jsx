import { ExternalLink, CheckCircle2, Eye, Globe } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cleanText } from "../../lib/text"

export default function DeliveredWebsiteCard({ product }) {
  const navigate = useNavigate()
  const demoUrl = product.demoUrl || (product.slug ? `/products/${product.slug}?preview=true` : "#")
  const isExternal = demoUrl.startsWith("http://") || demoUrl.startsWith("https://")

  // Show max 3-4 points max as requested
  const highlights = (product.features || []).slice(0, 4)

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/90 p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/5">

      {/* Browser Window Mockup */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-ink-800 border border-white/5 shadow-inner">

        {/* Browser Top Bar */}
        <div className="flex items-center gap-1.5 bg-ink-950/80 px-3 py-2 border-b border-white/5">
          <div className="h-2 w-2 rounded-full bg-rose-500/80" />
          <div className="h-2 w-2 rounded-full bg-amber-500/80" />
          <div className="h-2 w-2 rounded-full bg-emerald-500/80" />
          <div className="ml-2 flex h-4 flex-1 items-center rounded bg-ink-850/60 px-2 text-[9px] text-cloud-400 truncate select-none font-mono">
            {product.demoUrl ? product.demoUrl.replace(/^https?:\/\//, "") : product.name.toLowerCase()}
          </div>
        </div>

        {/* Website Image Preview */}
        <div className="relative h-[calc(100%-24px)] w-full overflow-hidden bg-ink-950">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="h-full w-full object-cover object-top transition-all duration-[3000ms] ease-in-out group-hover:object-bottom"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-gradient-soft text-brand-300 font-bold text-xs select-none">
              <Globe size={18} className="mr-1.5" /> Website Preview
            </div>
          )}

          {/* Clickable Image Overlay */}
          {isExternal ? (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={`Visit ${product.name}`}
            />
          ) : (
            <button
              onClick={() => navigate(demoUrl)}
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={`Visit ${product.name}`}
            />
          )}

          {/* Badges Overlay */}
          {product.displayTag ? (
            <span className="absolute left-2.5 top-2.5 z-20 rounded-md bg-emerald-500/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm pointer-events-none">
              {product.displayTag}
            </span>
          ) : null}

          {product.price && (
            <span className="absolute right-2.5 top-2.5 z-20 rounded-full bg-ink-950/90 backdrop-blur-sm px-2.5 py-0.5 text-xs font-extrabold text-cloud-100 shadow-sm border border-white/10 pointer-events-none">
              Starting ₹{product.price.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>

      {/* Content Details */}
      <div className="mt-4 flex flex-1 flex-col justify-between text-left">
        <div>
          <h3 className="font-display text-base font-bold text-cloud-100 line-clamp-1 group-hover:text-brand-300 transition">
            {isExternal ? (
              <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                {product.name}
              </a>
            ) : (
              product.name
            )}
          </h3>

          {/* 3-4 Highlights Points max */}
          <ul className="mt-3 space-y-2">
            {highlights.map((highlight, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-cloud-300 font-medium leading-tight">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span className="line-clamp-1 break-words">{cleanText(highlight)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button: ALWAYS View Website */}
        <div className="mt-5 pt-3 border-t border-white/5 relative z-20">
          {isExternal ? (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/20 py-2.5 px-4 text-xs font-bold text-brand-300 transition hover:bg-brand-500/20 hover:text-white cursor-pointer"
            >
              <Eye size={14} /> View Website <ExternalLink size={12} />
            </a>
          ) : (
            <button
              onClick={() => navigate(demoUrl)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/20 py-2.5 px-4 text-xs font-bold text-brand-300 transition hover:bg-brand-500/20 hover:text-white cursor-pointer"
            >
              <Eye size={14} /> View Website <ExternalLink size={12} />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
