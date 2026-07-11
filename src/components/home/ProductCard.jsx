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
    if (product.demoUrl) window.open(product.demoUrl, "_blank", "noopener")
    else navigate(`/products/${product.slug}`)
  }

  return (
    <div className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/8 bg-ink-850 transition hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-2xl hover:shadow-black/40">
      {/* image + live preview */}
      <div
        onClick={handleImageTap}
        className="group relative block aspect-[4/3] cursor-pointer overflow-hidden"
        style={image ? undefined : toneGradient(tone, 140)}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/90 font-display text-base font-extrabold text-ink-900 shadow-lg">
                {initialsOf(product.name)}
              </span>
              <span className="text-sm font-semibold text-white drop-shadow">{product.name}</span>
            </div>
          </>
        )}

        {onSale && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow sm:left-2.5 sm:top-2.5 sm:px-2 sm:py-1 sm:text-[10px]">
            Sale
          </span>
        )}

        {/* live preview pill — shown on desktop hover, or after a tap on mobile (no hover there).
            pointer-events-none while hidden so the first tap reaches the image div below instead
            of silently hitting this (invisible but otherwise still-clickable) overlay. */}
        <div
          className={[
            "absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 pointer-events-none transition duration-200 group-hover:bg-black/35 group-hover:opacity-100 group-hover:pointer-events-auto",
            showPreview ? "pointer-events-auto bg-black/35 opacity-100" : "",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={handlePreviewClick}
            className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md ring-1 ring-white/30 transition hover:scale-105"
          >
            <Eye size={16} /> Live Preview
          </button>
        </div>
      </div>

      {/* body */}
      <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-4">
        <Link to={`/products/${product.slug}`} className="truncate text-xs font-semibold text-cloud-100 hover:text-brand-300 sm:text-sm">
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-cloud-400 sm:line-clamp-2 sm:text-xs">{product.shortDescription}</p>

        <div className="mt-2 flex min-w-0 flex-col gap-1 sm:mt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            <span className="hidden text-[11px] text-cloud-500 sm:inline">Price:</span>
            {onSale && <span className="text-[11px] text-cloud-500 line-through sm:text-xs">{formatINR(product.price)}</span>}
            <span className="font-display text-sm font-bold text-cloud-100 sm:text-base">{formatINR(effectivePrice)}</span>
          </div>
          <StarRating rating={product.rating} reviews={product.numReviews} />
        </div>

        <div className="mt-2 flex flex-col gap-1.5 sm:mt-3 sm:flex-row sm:gap-2">
          <button
            onClick={handleBuyNow}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-[11px] font-semibold text-white transition hover:opacity-95 sm:w-auto sm:flex-1 sm:py-2 sm:text-xs"
          >
            <ShoppingCart size={13} /> Buy Now
          </button>
          <Link
            to={`/products/${product.slug}`}
            className="flex w-full items-center justify-center rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-cloud-200 transition hover:bg-white/5 sm:w-auto sm:py-2 sm:text-xs"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}
