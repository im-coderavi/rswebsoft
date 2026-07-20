import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, ShoppingCart } from "lucide-react"
import toast from "react-hot-toast"
import StarRating from "../ui/StarRating"
import { toneGradient } from "../../lib/tones"
import { formatINR } from "../../lib/currency"
import { useCart } from "../../context/CartContext"

function initialsOf(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export default function ProductCard({ product }) {
  const { add } = useCart()
  const navigate = useNavigate()
  const [showPreview, setShowPreview] = useState(false)
  const image = product.images?.[0]?.url
  const tone = product.category?.tone || "violet"
  const onSale = product.salePrice != null && product.salePrice < product.price
  const effectivePrice = onSale ? product.salePrice : product.price

  function handleBuyNow(e) {
    e.preventDefault()
    e.stopPropagation()
    add(
      {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        image: image || "",
        price: effectivePrice,
      },
      1
    )
    toast.success(`${product.name} added to cart`)
  }

  // Mobile has no hover state, so the first tap on the image just reveals the
  // "Live Preview" pill (matching the desktop hover look); a second tap, on
  // the pill itself, actually opens the preview.
  function handleImageTap() {
    if (!showPreview) setShowPreview(true)
  }

  function handlePreviewClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (product.demoUrl && (product.demoUrl.startsWith("http://") || product.demoUrl.startsWith("https://"))) {
      window.open(product.demoUrl, "_blank", "noopener,noreferrer")
    } else {
      navigate(`/products/${product.slug}?preview=true`)
    }
  }

  return (
    <div className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/8 bg-ink-850 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-500/45 hover:shadow-2xl hover:shadow-black/45">
      {/* image + live preview */}
      <div
        onClick={handleImageTap}
        className="group relative block aspect-[4/3] cursor-pointer overflow-hidden bg-ink-900 border-b border-white/5"
        style={image ? undefined : toneGradient(tone, 140)}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-all duration-[3000ms] ease-in-out group-hover:object-bottom"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_55%)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/95 font-display text-sm font-black text-ink-950 shadow-lg">
                {initialsOf(product.name)}
              </span>
              <span className="text-xs font-semibold text-white drop-shadow-sm truncate max-w-full">{product.name}</span>
            </div>
          </>
        )}

        {onSale && (
          <span className="absolute left-2.5 top-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-md">
            Sale
          </span>
        )}

        {/* live preview pill */}
        <div
          className={[
            "absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 pointer-events-none transition duration-200 group-hover:bg-black/40 group-hover:opacity-100 group-hover:pointer-events-auto",
            showPreview ? "pointer-events-auto bg-black/40 opacity-100" : "",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={handlePreviewClick}
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md ring-1 ring-white/30 transition hover:scale-105"
          >
            <Eye size={14} /> Live Preview
          </button>
        </div>
      </div>

      {/* body */}
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <Link 
          to={`/products/${product.slug}`} 
          className="truncate font-display text-sm font-extrabold text-cloud-100 hover:text-emerald-400 transition"
        >
          {product.name}
        </Link>
        
        {/* Features Checklist / Description bullet points */}
        <ul className="mt-3 space-y-1.5 flex-1 min-h-[64px] sm:min-h-[76px] text-left">
          {product.features && product.features.length > 0 ? (
            product.features.slice(0, 3).map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[11px] leading-tight text-cloud-400 sm:text-xs">
                <span className="text-emerald-400 font-bold select-none mt-0.5">•</span>
                <span className="line-clamp-1">{feat}</span>
              </li>
            ))
          ) : (
            <li className="text-[11px] leading-normal text-cloud-500 sm:text-xs line-clamp-3">
              {(product.shortDescription || product.description || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim()}
            </li>
          )}
        </ul>

        {/* Price & Rating */}
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex flex-col text-left">
            {onSale && (
              <span className="text-[10px] text-cloud-500 line-through leading-none">
                {formatINR(product.price)}
              </span>
            )}
            <span className="font-display text-sm font-black text-cloud-100 sm:text-base leading-tight mt-0.5">
              {formatINR(effectivePrice)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <StarRating rating={product.rating} reviews={product.numReviews} />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleBuyNow}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-4 py-2 text-xs font-bold text-white transition hover:opacity-95 shadow-md shadow-brand-500/10 sm:flex-1 cursor-pointer"
          >
            <ShoppingCart size={13} /> Buy Now
          </button>
          <Link
            to={`/products/${product.slug}`}
            className="flex w-full items-center justify-center rounded-xl border border-white/12 px-4 py-2 text-xs font-bold text-cloud-200 transition hover:bg-white/5 sm:w-auto cursor-pointer"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}
