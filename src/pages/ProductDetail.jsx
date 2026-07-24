import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { 
  ShoppingCart, 
  Zap, 
  Eye, 
  Check, 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  CheckCircle2,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Package,
  MessageCircle
} from "lucide-react"
import toast from "react-hot-toast"
import { useProduct } from "../hooks/useProducts"
import { useCart } from "../context/CartContext"
import { usePaymentSettings } from "../hooks/usePaymentSettings"
import { toneGradient } from "../lib/tones"
import { formatINR } from "../lib/currency"
import { cleanText, cleanRichText } from "../lib/text"
import RelatedProducts from "../components/product/RelatedProducts"
import ProductPreviewModal from "../components/product/ProductPreviewModal"

function initialsOf(name) {
  return name ? name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() : "RS"
}

// Scarcity Timer
function ScarcityTimer() {
  const [timeLeft, setTimeLeft] = useState(600)

  useEffect(() => {
    const storedTarget = localStorage.getItem("scarcity_timer_target")
    let targetTime
    if (storedTarget) {
      targetTime = parseInt(storedTarget, 10)
      if (Date.now() > targetTime) {
        targetTime = Date.now() + 10 * 60 * 1000
        localStorage.setItem("scarcity_timer_target", targetTime.toString())
      }
    } else {
      targetTime = Date.now() + 10 * 60 * 1000
      localStorage.setItem("scarcity_timer_target", targetTime.toString())
    }

    const interval = setInterval(() => {
      const now = Date.now()
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000))
      if (diff === 0) {
        const newTarget = Date.now() + 10 * 60 * 1000
        localStorage.setItem("scarcity_timer_target", newTarget.toString())
        setTimeLeft(600)
      } else {
        setTimeLeft(diff)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const pad = (num) => String(num).padStart(2, "0")

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-bold text-rose-400">
      <Clock size={13} className="text-rose-500 animate-pulse" />
      <span>Special Offer Ends in:</span>
      <span className="font-mono text-xs font-extrabold text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/20">
        {pad(minutes)}m {pad(seconds)}s
      </span>
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: product, isLoading } = useProduct(slug)
  const { add } = useCart()
  const { data: paymentSettings } = usePaymentSettings()
  const [selectedImgIndex, setSelectedImgIndex] = useState(0)
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get("preview") === "true") {
      setIsPreviewOpen(true)
    }
  }, [searchParams])

  function handleOpenPreview(e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIsPreviewOpen(true)
  }

  if (isLoading) {
    return (
      <div className="bg-ink-950 min-h-screen py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
        <p className="mt-4 text-sm text-cloud-400 font-medium">Loading product details…</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="bg-ink-950 min-h-screen py-24 text-center">
        <p className="text-lg text-cloud-300 font-semibold">Product not found.</p>
        <button
          onClick={() => navigate("/products")}
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-brand-400 hover:underline cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Products
        </button>
      </div>
    )
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
    add(cartItem(), 1)
    toast.success(`${product.name} added to cart`)
  }

  function handleBuyNow() {
    add(cartItem(), 1)
    navigate("/checkout")
  }

  function whatsappLinkFor(pkg) {
    const number = (paymentSettings?.whatsappNumber || "").replace(/\D/g, "")
    if (!number) return null
    const message = `Hi! I'm interested in buying "${pkg.name}" for "${product.name}" (${formatINR(pkg.price)}).\n${window.location.href}`
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
  }


  const activeImage = images[selectedImgIndex]?.url || images[0]?.url

  return (
    <div className="bg-ink-950 min-h-screen text-cloud-100 pb-16">
      
      {/* HERO SECTION: Image & Buy Box Side-by-Side */}
      <section className="container-rs pt-6 pb-8 sm:pb-12">
        
        {/* Top Breadcrumb & Category Badge */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-2 text-xs font-semibold text-cloud-400 hover:text-cloud-100 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Products
          </button>

          {product.category?.name && (
            <span className="rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-xs font-bold text-brand-300">
              {product.category.name}
            </span>
          )}
        </div>

        {/* 2-Column Main Hero Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          
          {/* LEFT COLUMN: Main Image Gallery (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Main Product Image Container */}
            <div 
              className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl transition duration-300"
              style={activeImage ? undefined : toneGradient(tone, 140)}
            >
              {activeImage ? (
                <img 
                  src={activeImage} 
                  alt={product.name} 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-900/40 to-ink-900">
                  <span className="grid h-20 w-20 place-items-center rounded-2xl bg-white/95 font-display text-2xl font-extrabold text-ink-950 shadow-lg">
                    {initialsOf(product.name)}
                  </span>
                </div>
              )}

              {/* Floating Live Preview CTA on Image */}
              <button
                onClick={handleOpenPreview}
                className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-ink-950/90 backdrop-blur-md border border-brand-500/40 px-4 py-2 text-xs font-bold text-cloud-100 hover:bg-brand-500/20 hover:text-white transition shadow-lg cursor-pointer"
              >
                <Eye size={14} className="text-brand-400" /> Live Demo Preview <ExternalLink size={12} />
              </button>
            </div>

            {/* Thumbnail Navigation (If multiple images exist) */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIndex(idx)}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition cursor-pointer ${
                      selectedImgIndex === idx 
                        ? "border-brand-400 ring-2 ring-brand-500/30" 
                        : "border-white/10 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Value Props under Image */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl border border-white/5 bg-ink-900/60 p-3 text-center">
                <div className="text-emerald-400 font-extrabold text-xs flex justify-center items-center gap-1.5 mb-1">
                  <CheckCircle2 size={14} /> Instant Access
                </div>
                <p className="text-[11px] text-cloud-400 font-medium">Direct zip download</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-ink-900/60 p-3 text-center">
                <div className="text-emerald-400 font-extrabold text-xs flex justify-center items-center gap-1.5 mb-1">
                  <CheckCircle2 size={14} /> Clean Code
                </div>
                <p className="text-[11px] text-cloud-400 font-medium">100% Verified &amp; Safe</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-ink-900/60 p-3 text-center">
                <div className="text-emerald-400 font-extrabold text-xs flex justify-center items-center gap-1.5 mb-1">
                  <CheckCircle2 size={14} /> Free Updates
                </div>
                <p className="text-[11px] text-cloud-400 font-medium">Lifetime package access</p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Product Title & Buy Box (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="rounded-2xl border border-white/10 bg-ink-900/90 p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-5">
              
              {/* Scarcity Timer */}
              <ScarcityTimer />

              {/* Product Title & Review Rating */}
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl leading-snug">
                  {product.name}
                </h1>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => {
                      const numRating = typeof product.rating === "number" ? product.rating : parseFloat(product.rating) || 5
                      return (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.round(numRating) ? "fill-star text-star" : "text-ink-600"}
                        />
                      )
                    })}
                  </div>
                  <span className="text-xs font-bold text-cloud-300">
                    {typeof product.rating === "number" ? product.rating.toFixed(1) : parseFloat(product.rating || 5).toFixed(1)}{" "}
                    <span className="text-cloud-500 font-normal">({(product.numReviews != null ? product.numReviews : 128).toLocaleString()} reviews)</span>
                  </span>
                </div>
              </div>

              {/* Short Description (Concise 2 lines max) */}
              {product.shortDescription && (
                <p className="text-xs text-cloud-300 leading-relaxed line-clamp-2 whitespace-pre-line">
                  {product.shortDescription}
                </p>
              )}

              {/* Price Display */}
              <div className="rounded-xl border border-white/5 bg-ink-950/60 p-4 space-y-1">
                <span className="text-[11px] font-bold text-cloud-400 uppercase tracking-wider">
                  One-time Download Price
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-black text-cloud-100 sm:text-4xl">
                    {formatINR(effectivePrice)}
                  </span>
                  {onSale && (
                    <span className="text-sm text-cloud-500 line-through font-semibold">
                      {formatINR(product.price)}
                    </span>
                  )}
                  {onSale && (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                      Save {Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-cloud-400">Includes lifetime updates &amp; installation support</p>
              </div>

              {/* Action Buttons: Buy Now, Add to Cart, Live Preview */}
              <div className="space-y-3 pt-1">
                <button
                  onClick={handleBuyNow}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-gradient py-3.5 px-6 text-sm font-extrabold text-white transition hover:opacity-95 shadow-lg shadow-brand-500/20 cursor-pointer"
                >
                  <Zap size={16} fill="currentColor" /> Buy Now
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-xs font-bold text-cloud-100 transition hover:bg-white/10 cursor-pointer"
                  >
                    <ShoppingCart size={15} /> Add to Cart
                  </button>

                  <button
                    onClick={handleOpenPreview}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 py-3 px-4 text-xs font-bold text-brand-300 transition hover:bg-brand-500/20 cursor-pointer"
                  >
                    <Eye size={15} /> Live Preview <ExternalLink size={12} />
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* DETAILED INFORMATION SECTION */}
      <section className="container-rs py-10 border-t border-white/5 space-y-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side (lg:col-span-8): Compact Product Description & Features */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Long Description Card with Read More toggle */}
            <div className="rounded-2xl border border-white/8 bg-ink-900/60 p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/10 text-brand-300">
                  <FileText size={16} />
                </span>
                <h2 className="font-display text-lg font-bold text-cloud-100">
                  Product Overview
                </h2>
              </div>

              {product.description ? (
                <div>
                  <p
                    className={`text-xs sm:text-sm text-cloud-300 leading-relaxed whitespace-pre-line break-words transition-all duration-300 ${
                      showFullDesc ? "" : "line-clamp-4 overflow-hidden"
                    }`}
                  >
                    {cleanRichText(product.description)}
                  </p>

                  {/* Toggle Full Description */}
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 transition cursor-pointer"
                  >
                    {showFullDesc ? (
                      <>Show Less <ChevronUp size={14} /></>
                    ) : (
                      <>Read Full Description <ChevronDown size={14} /></>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-cloud-400 leading-relaxed">
                  This product offers complete source code files optimized for speed, security, and effortless customization.
                </p>
              )}
            </div>

            {/* Features Card (If present) */}
            {product.features?.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-ink-900/60 p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
                    <Sparkles size={16} />
                  </span>
                  <h2 className="font-display text-lg font-bold text-cloud-100">
                    Key Features Included
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="flex min-w-0 items-start gap-2.5 rounded-xl border border-white/5 bg-ink-850/60 p-3 text-xs font-medium text-cloud-200">
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <span className="break-words">{cleanText(feature)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Packages Card (If present) — informational only, no purchase action */}
            {product.packages?.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-ink-900/60 p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
                    <Package size={16} />
                  </span>
                  <h2 className="font-display text-lg font-bold text-cloud-100">
                    Available Packages
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.packages.map((pkg, idx) => (
                    <div key={idx} className="flex flex-col rounded-xl border border-white/5 bg-ink-850/60 p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold text-cloud-100">{pkg.name}</span>
                        <span className="text-sm font-extrabold text-brand-300">{formatINR(pkg.price)}</span>
                      </div>
                      {pkg.description && (
                        <p className="mt-1.5 text-xs text-cloud-400 leading-relaxed">{pkg.description}</p>
                      )}

                      {pkg.features?.length > 0 && (
                        <ul className="mt-2.5 space-y-1.5 flex-1">
                          {pkg.features.map((feature, fi) => (
                            <li key={fi} className="flex items-start gap-1.5 text-[11px] text-cloud-300">
                              <Check size={11} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-400" />
                              <span className="break-words">{cleanText(feature)}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {whatsappLinkFor(pkg) && (
                        <a
                          href={whatsappLinkFor(pkg)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 cursor-pointer"
                        >
                          <MessageCircle size={14} /> Buy on WhatsApp
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Side (lg:col-span-4): Buyer Protection Card */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="rounded-2xl border border-white/8 bg-ink-900/80 p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold text-cloud-100">Buyer Protection</h3>
                  <p className="text-[11px] text-cloud-400">Free Setup &amp; Guarantee</p>
                </div>
              </div>

              <p className="text-xs text-cloud-300 leading-relaxed">
                We provide free installation support to help you deploy the source code on your hosting server.
              </p>

              <ul className="space-y-2 text-xs text-cloud-300 font-medium pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Free installation help by our team</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>100% refund within 7 days if setup fails</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Instant zip delivery after purchase</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </section>


      {/* RELATED PRODUCTS SECTION (Max 3 items) */}
      <section className="container-rs pt-6">
        <RelatedProducts categoryId={product.category?._id} excludeId={product._id} />
      </section>

      {/* FULL-SCREEN LIVE TEMPLATE PREVIEW MODAL */}
      <ProductPreviewModal 
        product={product} 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
      />

    </div>
  )
}
