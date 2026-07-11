import { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { ShoppingCart, Zap, Eye, Tag, Minus, Plus, Share2, Check, CalendarDays, Layers3 } from "lucide-react"
import toast from "react-hot-toast"
import { useProduct } from "../hooks/useProducts"
import { useCart } from "../context/CartContext"
import { toneGradient } from "../lib/tones"
import { formatINR } from "../lib/currency"
import StarRating from "../components/ui/StarRating"
import Reveal from "../components/ui/Reveal"
import CountdownTimer from "../components/product/CountdownTimer"
import TrustBadges from "../components/product/TrustBadges"
import ProductFAQ from "../components/product/ProductFAQ"
import RelatedProducts from "../components/product/RelatedProducts"

function initialsOf(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: product, isLoading } = useProduct(slug)
  const { add } = useCart()
  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [shared, setShared] = useState(false)

  if (isLoading) {
    return <p className="container-rs py-20 text-center text-cloud-500">Loading product…</p>
  }
  if (!product) {
    return <p className="container-rs py-20 text-center text-cloud-500">Product not found.</p>
  }

  const onSale = product.salePrice != null && product.salePrice < product.price
  const effectivePrice = onSale ? product.salePrice : product.price
  const images = product.images || []
  const tone = product.category?.tone || "violet"

  function cartItem() {
    return {
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: images[0]?.url || "",
      price: effectivePrice,
    }
  }

  function handleAddToCart() {
    add(cartItem(), qty)
    toast.success(`${product.name} added to cart`)
  }

  function handleBuyNow() {
    add(cartItem(), qty)
    navigate("/checkout")
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url })
      } catch {
        /* user cancelled share sheet — no-op */
      }
      return
    }
    await navigator.clipboard.writeText(url)
    setShared(true)
    toast.success("Link copied to clipboard")
    setTimeout(() => setShared(false), 1500)
  }

  const specs = [
    { label: "Category", value: product.category?.name },
    { label: "Brand", value: product.brand?.name || "—" },
    { label: "Type", value: product.type },
    { label: "Added", value: new Date(product.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
  ]

  return (
    <section className="container-rs py-10">
      <nav className="mb-6 text-sm text-cloud-500">
        <Link to="/" className="hover:text-cloud-300">Home</Link>
        <span className="mx-2">/</span>
        <Link to={`/products?category=${product.category?._id}`} className="hover:text-cloud-300">
          {product.category?.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-cloud-300">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* gallery */}
        <div>
          <div
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/8"
            style={images[activeImage] ? undefined : toneGradient(tone, 140)}
          >
            {images[activeImage] ? (
              <img src={images[activeImage].url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="grid h-20 w-20 place-items-center rounded-2xl bg-white/90 font-display text-2xl font-extrabold text-ink-900 shadow-lg">
                  {initialsOf(product.name)}
                </span>
              </div>
            )}
            {onSale && (
              <span className="absolute left-3 top-3 rounded-md bg-rose-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                Sale
              </span>
            )}
            {product.demoUrl && (
              <a
                href={product.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition duration-200 group-hover:bg-black/35 group-hover:opacity-100"
              >
                <span className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md ring-1 ring-white/30">
                  <Eye size={17} /> Live Preview
                </span>
              </a>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2.5">
              {images.map((img, i) => (
                <button
                  key={img.publicId}
                  onClick={() => setActiveImage(i)}
                  className={[
                    "h-16 w-16 overflow-hidden rounded-lg border-2 transition",
                    i === activeImage ? "border-brand-500" : "border-white/10 opacity-70 hover:opacity-100",
                  ].join(" ")}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* buy box */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              {product.brand && (
                <Link to={`/products?brand=${product.brand._id}`} className="mb-2 inline-block text-xs font-medium text-brand-300 hover:underline">
                  {product.brand.name}
                </Link>
              )}
              <h1 className="font-display text-3xl font-bold text-cloud-100">{product.name}</h1>
            </div>
            <button
              onClick={handleShare}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-cloud-300 transition hover:bg-white/5"
              aria-label="Share this product"
            >
              {shared ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            </button>
          </div>
          <p className="mt-2 text-cloud-400">{product.shortDescription}</p>

          <div className="mt-4 flex items-center gap-4">
            <StarRating rating={product.rating} reviews={product.numReviews} />
            <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-300">
              {product.type}
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-4xl font-extrabold text-cloud-100">{formatINR(effectivePrice)}</span>
            {onSale && (
              <>
                <span className="text-lg text-cloud-500 line-through">{formatINR(product.price)}</span>
                <span className="rounded-md bg-rose-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                  Sale
                </span>
              </>
            )}
          </div>

          {onSale && product.saleEndsAt && (
            <div className="mt-4">
              <CountdownTimer target={product.saleEndsAt} />
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 px-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-11 w-9 place-items-center text-cloud-300 hover:text-cloud-100"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-sm font-semibold text-cloud-100">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="grid h-11 w-9 place-items-center text-cloud-300 hover:text-cloud-100"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={handleBuyNow}
              className="flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95 glow-shadow"
            >
              <Zap size={17} /> Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-cloud-100 transition hover:bg-white/10"
            >
              <ShoppingCart size={17} /> Add to Cart
            </button>
            {product.demoUrl && (
              <a
                href={product.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-cloud-300 transition hover:bg-white/5"
              >
                <Eye size={16} /> Live Preview
              </a>
            )}
          </div>

          <TrustBadges />

          {product.tags?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs text-cloud-400">
                  <Tag size={11} /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* full-width content */}
      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {product.features?.length > 0 && (
            <Reveal className="mb-10">
              <h2 className="mb-4 font-display text-xl font-bold text-cloud-100">What's Included</h2>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-cloud-300">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {product.description && (
            <Reveal>
              <h2 className="mb-3 font-display text-xl font-bold text-cloud-100">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-cloud-400">{product.description}</p>
            </Reveal>
          )}

          <ProductFAQ />
        </div>

        {/* specs sidebar */}
        <Reveal delay={0.1} className="h-fit rounded-2xl border border-white/8 bg-ink-850 p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <Layers3 size={17} className="text-brand-300" />
            <h3 className="text-sm font-bold text-cloud-100">Product Details</h3>
          </div>
          <dl className="space-y-3">
            {specs.map((s) => (
              <div key={s.label} className="flex items-center justify-between border-b border-white/5 pb-3 text-sm last:border-0 last:pb-0">
                <dt className="text-cloud-500">{s.label}</dt>
                <dd className="font-medium capitalize text-cloud-200">{s.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-center gap-2 text-xs text-cloud-500">
            <CalendarDays size={13} />
            Last updated {new Date(product.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </Reveal>
      </div>

      <RelatedProducts categoryId={product.category?._id} excludeId={product._id} />
    </section>
  )
}
