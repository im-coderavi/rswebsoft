import { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { ShoppingCart, Zap, ExternalLink, Tag } from "lucide-react"
import toast from "react-hot-toast"
import { useProduct, useProducts } from "../hooks/useProducts"
import { useCart } from "../context/CartContext"
import { toneGradient } from "../lib/tones"
import StarRating from "../components/ui/StarRating"
import ProductCard from "../components/home/ProductCard"

function initialsOf(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: product, isLoading } = useProduct(slug)
  const { add } = useCart()
  const [activeImage, setActiveImage] = useState(0)

  const { data: relatedData } = useProducts({
    category: product?.category?._id,
    status: "published",
    limit: 7,
  })
  const related = (relatedData?.items || []).filter((p) => p._id !== product?._id).slice(0, 6)

  if (isLoading) {
    return <p className="container-rs py-20 text-center text-cloud-500">Loading product…</p>
  }
  if (!product) {
    return <p className="container-rs py-20 text-center text-cloud-500">Product not found.</p>
  }

  const effectivePrice = product.salePrice ?? product.price
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
    add(cartItem(), 1)
    toast.success(`${product.name} added to cart`)
  }

  function handleBuyNow() {
    add(cartItem(), 1)
    navigate("/checkout")
  }

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
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/8" style={images[activeImage] ? undefined : toneGradient(tone, 140)}>
            {images[activeImage] ? (
              <img src={images[activeImage].url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="grid h-20 w-20 place-items-center rounded-2xl bg-white/90 font-display text-2xl font-extrabold text-ink-900 shadow-lg">
                  {initialsOf(product.name)}
                </span>
              </div>
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

        {/* details */}
        <div>
          {product.brand && (
            <Link to={`/products?brand=${product.brand._id}`} className="mb-2 inline-block text-xs font-medium text-brand-300 hover:underline">
              {product.brand.name}
            </Link>
          )}
          <h1 className="font-display text-3xl font-bold text-cloud-100">{product.name}</h1>
          <p className="mt-2 text-cloud-400">{product.shortDescription}</p>

          <div className="mt-4 flex items-center gap-4">
            <StarRating rating={product.rating} reviews={product.numReviews} />
            <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-300">
              {product.type}
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-4xl font-extrabold text-cloud-100">${effectivePrice}</span>
            {product.salePrice != null && (
              <span className="text-lg text-cloud-500 line-through">${product.price}</span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
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
                <ExternalLink size={16} /> Live Demo
              </a>
            )}
          </div>

          {product.description && (
            <div className="mt-8 border-t border-white/8 pt-6">
              <h2 className="mb-2 text-sm font-semibold text-cloud-100">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-cloud-400">{product.description}</p>
            </div>
          )}

          {product.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs text-cloud-400">
                  <Tag size={11} /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-5 font-display text-2xl font-bold text-cloud-100">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
