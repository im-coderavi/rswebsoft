import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
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
  Package, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import toast from "react-hot-toast"
import { useProduct } from "../hooks/useProducts"
import { useCart } from "../context/CartContext"
import { toneGradient } from "../lib/tones"
import { formatINR } from "../lib/currency"
import RelatedProducts from "../components/product/RelatedProducts"

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
  const { data: product, isLoading } = useProduct(slug)
  const { add } = useCart()
  const [selectedImgIndex, setSelectedImgIndex] = useState(0)
  const [showFullDesc, setShowFullDesc] = useState(false)

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

  // Maximum 2 support/setup packages
  const supportPlans = [
    { 
      id: "starter",
      name: "Standard Source Code", 
      price: 0, 
      desc: "Instant download & lifetime updates", 
      tag: "Included Free",
      isPopular: false,
      features: [
        "Full Source Code Access",
        "Online Documentation & Setup Guide",
        "Free Lifetime Product Updates",
        "Community & Standard Support"
      ] 
    },
    { 
      id: "pro",
      name: "VIP Done-For-You Setup", 
      price: 4999, 
      desc: "Complete end-to-end server deployment", 
      tag: "Most Popular",
      isPopular: true,
      features: [
        "Full Server & DB Deployment",
        "Payment Gateway & WooCommerce Config",
        "Custom Branding & Domain Mapping",
        "1-on-1 Dedicated Support Line",
        "100% Money-Back Setup Guarantee"
      ] 
    }
  ]

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
              {product.demoUrl && (
                <a
                  href={product.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-ink-950/80 backdrop-blur-md border border-white/15 px-4 py-2 text-xs font-bold text-cloud-100 hover:bg-ink-900 transition shadow-lg"
                >
                  <Eye size={14} className="text-brand-400" /> Live Demo Preview <ExternalLink size={12} />
                </a>
              )}
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
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-cloud-300">
                    4.9 <span className="text-cloud-500 font-normal">({product.numReviews || 128} reviews)</span>
                  </span>
                </div>
              </div>

              {/* Short Description (Concise 2 lines max) */}
              {product.shortDescription && (
                <div 
                  className="text-xs text-cloud-300 leading-relaxed html-content line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                />
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

                  {product.demoUrl ? (
                    <a
                      href={product.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 py-3 px-4 text-xs font-bold text-brand-300 transition hover:bg-brand-500/20"
                    >
                      <Eye size={15} /> Live Preview <ExternalLink size={12} />
                    </a>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-xs font-semibold text-cloud-500 cursor-not-allowed">
                      <Eye size={15} /> No Preview
                    </div>
                  )}
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
                  <div 
                    className={`text-xs sm:text-sm text-cloud-300 leading-relaxed html-content transition-all duration-300 ${
                      showFullDesc ? "" : "line-clamp-4 overflow-hidden"
                    }`}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />

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
                    <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-ink-850/60 p-3 text-xs font-medium text-cloud-200">
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <span>{feature}</span>
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

      {/* SETUP & SUPPORT PACKAGES (MAX 2 PACKAGES) */}
      <section className="container-rs py-10 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-300">
            <Package size={14} /> Deployment Options
          </div>
          <h2 className="font-display text-2xl font-extrabold text-cloud-100 sm:text-3xl">
            Choose Your Setup <span className="text-emerald-400">Package</span>
          </h2>
          <p className="text-xs sm:text-sm text-cloud-400 font-medium">
            Select between self-installation or let our expert dev team handle full deployment for you.
          </p>
        </div>

        {/* 2 Packages Max */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {supportPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative rounded-2xl border p-6 sm:p-7 flex flex-col justify-between transition duration-300 ${
                plan.isPopular 
                  ? "border-brand-500/50 bg-ink-900 shadow-xl shadow-brand-500/5 ring-1 ring-brand-500/20" 
                  : "border-white/8 bg-ink-900/60 hover:border-white/20"
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 right-6 rounded-full bg-brand-gradient px-3 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-md">
                  {plan.tag}
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-cloud-100">{plan.name}</h3>
                  <p className="text-xs text-cloud-400 mt-1">{plan.desc}</p>
                </div>

                <div className="font-display text-3xl font-black text-cloud-100">
                  {plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString("en-IN")}`}
                  {plan.price === 0 && <span className="text-xs font-normal text-cloud-500 ml-1.5">(With asset purchase)</span>}
                </div>

                <ul className="space-y-2 pt-2 border-t border-white/5">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs font-medium text-cloud-300">
                      <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" strokeWidth={3} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleBuyNow}
                  className={`w-full rounded-xl py-3 text-xs font-extrabold transition cursor-pointer ${
                    plan.isPopular 
                      ? "bg-brand-gradient text-white hover:opacity-95 shadow-md" 
                      : "border border-white/10 bg-white/5 text-cloud-200 hover:bg-white/10"
                  }`}
                >
                  {plan.price === 0 ? "Buy Asset Only" : "Select VIP Setup Plan"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RELATED PRODUCTS SECTION (Max 3 items) */}
      <section className="container-rs pt-6">
        <RelatedProducts categoryId={product.category?._id} excludeId={product._id} />
      </section>

    </div>
  )
}
