import { ExternalLink, CheckCircle2, Eye, Globe, MessageCircle } from "lucide-react"
import { cleanText } from "../../lib/text"
import { useDeliveredWebsiteSettings } from "../../hooks/useDeliveredWebsiteSettings"

export default function DeliveredWebsiteCard({ product }) {
  const { data: settings } = useDeliveredWebsiteSettings()

  // Admin leaves the number blank when they don't want to be contacted this
  // way, so the button simply isn't rendered.
  const whatsappNumber = settings?.whatsappNumber
  const enquiryUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hi! I'm interested in a website like "${product.name}". Can you tell me more?`
      )}`
    : null

  // Delivered showcase items are not for sale, so they must never link to
  // an internal /products/:slug page. Real sites open directly; anything
  // without a live demo URL falls back to the screenshot image instead.
  const demoUrl = product.demoUrl || product.images?.[0]?.url || "#"
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
              onClick={() => window.open(demoUrl, "_blank", "noopener,noreferrer")}
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={`Visit ${product.name}`}
            />
          )}

          {/* No displayTag badge here on purpose. It is free text that is
              usually pasted in as a whole feature list, so any badge built
              from it covers the screenshot — and the same points are already
              listed under the card. The screenshot is the point of this card;
              nothing should sit on top of it but the price. */}
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

        {/* Actions: Contact sits above View Website — a prospect asking for a
            site like this one is the outcome this showcase exists for. */}
        <div className="mt-5 space-y-2 pt-3 border-t border-white/5 relative z-20">
          {enquiryUrl && (
            <a
              href={enquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 py-2.5 px-4 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20 hover:text-emerald-300 cursor-pointer"
            >
              <MessageCircle size={14} /> Contact Us
            </a>
          )}
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
              onClick={() => window.open(demoUrl, "_blank", "noopener,noreferrer")}
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
