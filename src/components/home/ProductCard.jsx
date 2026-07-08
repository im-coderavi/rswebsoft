import { Link } from "react-router-dom"
import { Heart, ShoppingCart } from "lucide-react"
import toast from "react-hot-toast"
import StarRating from "../ui/StarRating"
import { toneGradient } from "../../lib/tones"
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
  const image = product.images?.[0]?.url
  const tone = product.category?.tone || "violet"
  const effectivePrice = product.salePrice ?? product.price

  function handleAddToCart(e) {
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

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-ink-850 transition hover:-translate-y-1 hover:border-brand-500/40"
    >
      {/* preview banner */}
      <div className="relative aspect-[16/10] overflow-hidden" style={image ? undefined : toneGradient(tone, 140)}>
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
        <button
          onClick={(e) => e.preventDefault()}
          className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-black/25 text-white/90 backdrop-blur transition hover:bg-black/40"
          aria-label="Add to wishlist"
        >
          <Heart size={15} />
        </button>
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2.5 right-2.5 grid h-8 w-8 place-items-center rounded-full bg-black/25 text-white/90 backdrop-blur transition hover:bg-brand-600"
          aria-label="Add to cart"
        >
          <ShoppingCart size={15} />
        </button>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-sm font-semibold text-cloud-100">{product.name}</h3>
        <p className="mt-0.5 truncate text-xs text-cloud-400">{product.shortDescription}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-baseline gap-1.5">
            <span className="font-display text-lg font-bold text-cloud-100">${effectivePrice}</span>
            {product.salePrice != null && (
              <span className="text-xs text-cloud-500 line-through">${product.price}</span>
            )}
          </span>
          <StarRating rating={product.rating} reviews={product.numReviews} />
        </div>
      </div>
    </Link>
  )
}
