import { Heart } from "lucide-react"
import StarRating from "../ui/StarRating"
import { toneGradient } from "../../lib/tones"

export default function ProductCard({ product }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-ink-850 transition hover:-translate-y-1 hover:border-brand-500/40">
      {/* preview banner */}
      <div className="relative aspect-[16/10] overflow-hidden" style={toneGradient(product.tone, 140)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
        <button
          className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-black/25 text-white/90 backdrop-blur transition hover:bg-black/40"
          aria-label="Add to wishlist"
        >
          <Heart size={15} />
        </button>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/90 font-display text-base font-extrabold text-ink-900 shadow-lg">
            {product.initials}
          </span>
          <span className="text-sm font-semibold text-white drop-shadow">{product.name}</span>
        </div>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-sm font-semibold text-cloud-100">{product.name}</h3>
        <p className="mt-0.5 truncate text-xs text-cloud-400">{product.tag}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-cloud-100">${product.price}</span>
          <StarRating rating={product.rating} reviews={product.reviews} />
        </div>
      </div>
    </div>
  )
}
