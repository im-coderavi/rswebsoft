import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { ShoppingCart, Zap, Eye, Check, CalendarDays, ArrowLeft, Star, ShieldCheck, Download, BookOpen, Clock, HelpCircle, ChevronDown, MessageSquare } from "lucide-react"
import toast from "react-hot-toast"
import { useProduct } from "../hooks/useProducts"
import { useCart } from "../context/CartContext"
import { toneGradient } from "../lib/tones"
import { formatINR } from "../lib/currency"
import RelatedProducts from "../components/product/RelatedProducts"

function initialsOf(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

// Scarcity Timer: Ticks down from 10 minutes, persists in localStorage, and loops
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
    <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-3.5 py-1 text-xs font-bold text-rose-400">
      <Clock size={12} className="text-rose-500" />
      <span>Offer ends in:</span>
      <span className="font-mono text-sm tracking-wider text-rose-500 font-extrabold bg-rose-950/20 px-1.5 py-0.5 rounded">
        {pad(minutes)}m {pad(seconds)}s
      </span>
    </div>
  )
}

// FAQ Accordion Component
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 text-left font-display text-sm font-bold text-cloud-100 sm:text-base cursor-pointer hover:text-brand-300 transition"
      >
        <span>{question}</span>
        <ChevronDown size={18} className={`text-cloud-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="mt-2 text-xs leading-relaxed text-cloud-400 sm:text-sm whitespace-pre-line">
          {answer}
        </p>
      )}
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: product, isLoading } = useProduct(slug)
  const { add } = useCart()

  if (isLoading) {
    return <p className="container-rs py-20 text-center text-cloud-500">Loading product details…</p>
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
    add(cartItem(), 1)
    toast.success(`${product.name} added to cart`)
  }

  function handleBuyNow() {
    add(cartItem(), 1)
    navigate("/checkout")
  }

  // Fallback Why Buy details
  const whyBuyList = [
    { title: "Developer Friendly", desc: "Clean code structure that is lightweight, highly modular, and extremely customizable." },
    { title: "Super Fast Setup", desc: "Deploy this package onto any hosting server in minutes with zero configurations." },
    { title: "Seo & Performance Ready", desc: "Designed with performance guidelines to achieve 90+ lighthouse speed metrics." },
    { title: "24/7 Priority Support", desc: "Dedicated expert technicians standing by to assist you with installation." },
    { title: "Instant Access", desc: "Get download links and registration keys emailed instantly after payment." },
    { title: "Lifetime Updates", desc: "Enjoy regular design refreshes, security patches, and feature additions forever." }
  ]

  // Setup support pricing tiers
  const supportPlans = [
    { name: "Starter Setup", price: 0, desc: "Standard deployment guidelines", tags: ["Self-installation"], features: ["Online PDF documentation", "Standard community support", "Access to public FAQs", "Standard updates"] },
    { name: "Professional Setup", price: 4999, desc: "Done-for-you package setup", tags: ["Most Popular"], features: ["Full server deployment", "WooCommerce checkout config", "Payment gateway integration", "12-24h response guarantee"] },
    { name: "Enterprise Custom", price: 19999, desc: "Dedicated setup & support options", tags: ["Premium Choice"], features: ["Done-for-you server scaling", "Custom layout modifications", "Dedicated dev support line", "1-12h response guarantee"] },
    { name: "Custom Support", price: "Custom", desc: "Tailored monthly/hourly support packages", tags: ["Corporate Option"], features: ["Dedicated support developer", "Custom feature additions", "SLA contract agreement", "Weekly health checks"] }
  ]

  return (
    <div className="bg-ink-950 min-h-screen text-cloud-100">
      
      {/* 1. HERO SECTION */}
      <section className="container-rs py-8 sm:py-12 border-b border-white/5">
        
        {/* Back navigation */}
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 text-xs font-semibold text-cloud-400 hover:text-cloud-100 transition mb-6 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-center">
          
          {/* Left Details block */}
          <div className="lg:col-span-7 text-left space-y-5">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-cloud-100 sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>
            <p className="text-sm sm:text-base text-cloud-400 leading-relaxed max-w-2xl">
              {product.shortDescription || "Get access to our premium digital resource optimized for speed, scalability, and performance."}
            </p>

            {/* Ratings count */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="currentColor" />
                ))}
              </div>
              <span className="text-xs text-cloud-400 font-semibold mt-0.5">
                4.9/5 ({product.numReviews || 128} reviews)
              </span>
            </div>

            {/* Price Box & Scarcity Timer */}
            <div className="flex flex-wrap items-center gap-4 py-3">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-black text-cloud-100 sm:text-4xl">
                  {formatINR(effectivePrice)}
                </span>
                {onSale && (
                  <span className="text-sm text-cloud-500 line-through">
                    {formatINR(product.price)}
                  </span>
                )}
              </div>
              <ScarcityTimer />
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/10">
                Offer valid today only
              </span>
            </div>

            {/* Actions Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleBuyNow}
                className="flex items-center gap-2 rounded-xl bg-brand-gradient px-7 py-3.5 text-sm font-extrabold text-white transition hover:opacity-95 glow-shadow cursor-pointer"
              >
                <Zap size={16} /> Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-cloud-100 transition hover:bg-white/10 cursor-pointer"
              >
                <ShoppingCart size={16} /> Add to Cart
              </button>
              {product.demoUrl && (
                <a
                  href={product.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3.5 text-sm font-semibold text-cloud-300 transition hover:bg-white/5"
                >
                  <Eye size={16} /> Live Preview
                </a>
              )}
            </div>
          </div>

          {/* Right Preview block */}
          <div className="lg:col-span-5">
            <div
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/8 bg-ink-850 shadow-2xl"
              style={images[0] ? undefined : toneGradient(tone, 140)}
            >
              {images[0] ? (
                <img src={images[0].url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="grid h-20 w-20 place-items-center rounded-2xl bg-white/95 font-display text-2xl font-extrabold text-ink-950 shadow-lg">
                    {initialsOf(product.name)}
                  </span>
                </div>
              )}
            </div>

            {/* Checklist under image preview */}
            <div className="mt-4 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-cloud-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" strokeWidth={3} /> Safe &amp; Secure Checkout
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" strokeWidth={3} /> Instant Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" strokeWidth={3} /> Lifetime Updates
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="bg-ink-900/60 border-b border-white/5 py-8">
        <div className="container-rs grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
          <div>
            <div className="font-display text-2xl font-black text-cloud-100 sm:text-3xl">500+</div>
            <div className="text-[10px] sm:text-xs font-bold text-cloud-500 uppercase tracking-wider mt-1">Happy Customers</div>
          </div>
          <div>
            <div className="font-display text-2xl font-black text-cloud-100 sm:text-3xl">4.9/5</div>
            <div className="text-[10px] sm:text-xs font-bold text-cloud-500 uppercase tracking-wider mt-1">Lighthouse Rating</div>
          </div>
          <div>
            <div className="font-display text-2xl font-black text-cloud-100 sm:text-3xl">24/7</div>
            <div className="text-[10px] sm:text-xs font-bold text-cloud-500 uppercase tracking-wider mt-1">Dedicated Support</div>
          </div>
          <div>
            <div className="font-display text-2xl font-black text-cloud-100 sm:text-3xl">100%</div>
            <div className="text-[10px] sm:text-xs font-bold text-cloud-500 uppercase tracking-wider mt-1">Satisfaction Guarantee</div>
          </div>
        </div>
      </section>

      {/* 3. WHY BUY THIS PRODUCT */}
      <section className="container-rs py-16 text-center border-b border-white/5">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl">
          Why <span className="text-emerald-400">Buy This Product?</span>
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-xs font-medium text-cloud-400 sm:text-sm">
          Highly optimized digital assets crafted by industry experts for top conversions.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-10 text-left">
          {whyBuyList.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-white/8 bg-ink-850 p-6 flex flex-col justify-between hover:border-brand-500/30 transition duration-300">
              <div>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/10 text-brand-300 border border-brand-500/10 mb-4">
                  <Check size={16} className="text-emerald-400" strokeWidth={3} />
                </span>
                <h3 className="font-display text-sm font-bold text-cloud-100">{item.title}</h3>
                <p className="mt-2 text-xs leading-normal text-cloud-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. ALL FEATURES INCLUDED */}
      {product.features?.length > 0 && (
        <section className="container-rs py-16 text-center border-b border-white/5">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl mb-10">
            All <span className="text-emerald-400">Features Included</span>
          </h2>
          <div className="max-w-4xl mx-auto grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 text-left">
            {product.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-ink-850/40 p-4">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 mt-0.5">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="text-xs sm:text-sm font-medium text-cloud-300">{feature}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. HOW IT WORKS */}
      <section className="container-rs py-16 text-center border-b border-white/5">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl">
          How It <span className="text-emerald-400">Works</span>
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-xs font-medium text-cloud-400 sm:text-sm">
          Get up and running in just a few straightforward steps.
        </p>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 mt-10">
          {[
            { step: "01", name: "Buy Now", desc: "Purchase safe and securely." },
            { step: "02", name: "Download", desc: "Access the code link instantly." },
            { step: "03", name: "Install", desc: "Deploy onto your hosting stack." },
            { step: "04", name: "Launch", desc: "Go live same-day successfully." }
          ].map((item, i) => (
            <div key={i} className="relative rounded-2xl border border-white/5 bg-ink-850/60 p-6">
              <span className="font-mono text-2xl font-black text-brand-300/40">{item.step}</span>
              <h3 className="font-display text-sm font-bold text-cloud-100 mt-2">{item.name}</h3>
              <p className="mt-1 text-[11px] text-cloud-400 leading-normal">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. INCLUDED DOCUMENTATION */}
      <section className="container-rs py-16 text-center border-b border-white/5">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl">
          Included <span className="text-emerald-400">Documentation</span>
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-xs font-medium text-cloud-400 sm:text-sm">
          Detailed user manual, configuration guides, and helper files are all included in the zip.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-3xl mx-auto mt-10 text-left">
          <div className="rounded-2xl border border-white/5 bg-ink-850 p-6 flex items-start gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-300 border border-brand-500/10">
              <BookOpen size={18} />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-cloud-100">Online PDF User Manual</h3>
              <p className="mt-1.5 text-xs text-cloud-400 leading-relaxed">
                Step-by-step documentation detailing variables, database connections, and hosting configuration steps.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-ink-850 p-6 flex items-start gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-300 border border-brand-500/10">
              <Download size={18} />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-cloud-100">Developer API Guide</h3>
              <p className="mt-1.5 text-xs text-cloud-400 leading-relaxed">
                Developer reference manual to assist you with layout overrides, CSS changes, and dynamic routing hooks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CUSTOMERS TESTIMONIAL */}
      <section className="container-rs py-16 text-center border-b border-white/5">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl mb-10">
          What Our <span className="text-emerald-400">Customers Say</span>
        </h2>
        <div className="rounded-2xl border border-white/5 bg-ink-850/60 p-6 sm:p-8 max-w-2xl mx-auto text-center space-y-4">
          <div className="flex justify-center gap-0.5 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="currentColor" />
            ))}
          </div>
          <p className="font-display text-sm sm:text-base font-semibold leading-relaxed text-cloud-100 italic">
            "Very clean code and highly optimized theme. Highly recommended for developers looking for high-quality setups. We built our e-commerce site with this template in just half a day."
          </p>
          <div>
            <div className="font-display text-xs sm:text-sm font-extrabold text-emerald-400">Avishek Giri</div>
            <div className="text-[10px] sm:text-xs text-cloud-500 font-semibold mt-0.5">Software Developer</div>
          </div>
        </div>
      </section>

      {/* 8. PRODUCT DESCRIPTION (Redesigned Details Card) */}
      <section className="container-rs py-16 border-b border-white/5">
        <div className="container-rs text-center mb-8">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl">
            Product <span className="text-emerald-400">Details</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto rounded-3xl bg-ink-900 border border-white/5 p-8 sm:p-10 shadow-xl text-left">
          <h3 className="font-display text-lg sm:text-xl font-bold text-cloud-100">
            {product.name}
          </h3>
          <p className="mt-3 text-xs sm:text-sm text-cloud-400 leading-relaxed">
            {product.shortDescription || "Get access to our premium digital resource optimized for speed, scalability, and performance."}
          </p>

          {product.features && product.features.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs sm:text-sm font-bold text-cloud-200 uppercase tracking-wider mb-3">
                What's Included:
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-cloud-400">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="pl-1">
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.description && (
            <div className="mt-6 border-t border-white/5 pt-4 text-xs sm:text-sm text-cloud-400 leading-relaxed">
              <p className="text-cloud-400">
                <span className="font-bold text-cloud-200">Note: </span>
                {product.description}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 9. REFUND POLICY BANNER (Redesigned Policy Card) */}
      <section className="container-rs py-10 border-b border-white/5">
        <div className="max-w-4xl mx-auto rounded-3xl bg-ink-900 border border-white/5 p-8 sm:p-10 shadow-xl text-left flex flex-col md:flex-row gap-6 items-start">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            <ShieldCheck size={24} />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-emerald-400">
                Installation Support &amp; Refund Policy
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-cloud-400 leading-relaxed">
                We are selling the source code at an affordable price. We provide free installation support to help you set it up on your hosting.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-cloud-400 font-medium">
              <li className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">✓</span>
                <span>Free installation support — if you face any issue installing the source code, our team will help you</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">✓</span>
                <span>If installation fails on your hosting despite our support, we'll issue a <span className="text-emerald-400 font-bold">full refund within 7 days</span></span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold">✕</span>
                <span>Once the product is successfully installed, <span className="text-rose-400 font-bold">no refund</span> will be provided</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-bold">i</span>
                <span>For complete setup, customization &amp; configuration — separate <span className="text-sky-400 font-bold">service charges</span> apply (see packages below)</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 10. SETUP & SUPPORT PACKAGES */}
      <section className="container-rs py-16 text-center border-b border-white/5">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl">
          Setup &amp; Support <span className="text-emerald-400">Packages</span>
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-xs font-medium text-cloud-400 sm:text-sm">
          Hire our technical development team to host, verify, or scale your purchased asset.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-10 text-left items-stretch">
          {supportPlans.map((plan, i) => (
            <div key={i} className="relative flex flex-col justify-between rounded-2xl border border-white/8 bg-ink-850 p-6 transition hover:border-brand-500/30">
              <div>
                <span className="rounded bg-brand-500/15 text-brand-300 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide">
                  {plan.tags?.[0]}
                </span>
                <h3 className="font-display text-sm font-bold text-cloud-100 mt-2">{plan.name}</h3>
                <p className="text-[10px] text-cloud-500 leading-snug mt-0.5">{plan.desc}</p>
                <div className="font-display text-xl font-black text-cloud-100 my-4">
                  {typeof plan.price === "number" ? `₹${plan.price.toLocaleString("en-IN")}` : plan.price}
                </div>
                <ul className="space-y-2 pb-4">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[10px] text-cloud-400 font-semibold">
                      <Check size={11} className="text-emerald-400 mt-0.5 shrink-0" strokeWidth={3} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button className="w-full rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-bold text-cloud-200 transition hover:bg-white/10 cursor-pointer">
                Order Package
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 11. FAQ SECTION */}
      <section className="container-rs py-16 text-center border-b border-white/5">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl mb-10">
          Frequently Asked <span className="text-emerald-400">Questions</span>
        </h2>
        <div className="max-w-3xl mx-auto rounded-2xl border border-white/8 bg-ink-850 p-6 text-left space-y-4">
          <FAQItem 
            question="What is setup support?" 
            answer="Setup support is a service package where our dev team handles server configuration, database linking, domain mapping, and payment configuration to deliver the website in a live state." 
          />
          <FAQItem 
            question="Can I customize the files?" 
            answer="Yes, purchasing the asset grants you full access to clean editable files (CSS, Javascript, PHP, or React sources) so you can modify design and logic as you see fit." 
          />
          <FAQItem 
            question="Is there a refund guarantee?" 
            answer="Yes, all templates are protected by our 7-day risk-free money-back guarantee. If you encounter any bugs that cannot be fixed, we will issue a full refund." 
          />
          <FAQItem 
            question="How do I receive updates?" 
            answer="Whenever updates are published, they will automatically appear in your customer portal. You can download the latest package zip file free of charge." 
          />
        </div>
      </section>

      {/* 12. BOTTOM CALL-TO-ACTION */}
      <section className="container-rs py-16 text-center border-b border-white/5">
        <div className="max-w-3xl mx-auto rounded-3xl bg-brand-gradient-soft border border-brand-500/10 p-8 sm:p-12 text-center space-y-6">
          <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3.5 py-1.5 text-xs font-extrabold text-rose-400 uppercase tracking-widest">
            Limited Time Offer
          </span>
          <h2 className="font-display text-2xl font-extrabold text-cloud-100 sm:text-3xl lg:text-4xl max-w-lg mx-auto leading-tight">
            Ready to Transform Your Business?
          </h2>
          <div className="font-display text-3xl font-black text-cloud-100 sm:text-4xl">
            {formatINR(effectivePrice)}
          </div>
          <p className="text-xs sm:text-sm text-cloud-400 font-medium">
            Get instant download links and lifetime updates emailed to you immediately after purchase.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-3">
            <button
              onClick={handleBuyNow}
              className="flex items-center gap-2 rounded-xl bg-brand-gradient px-8 py-4 text-sm font-extrabold text-white transition hover:opacity-95 shadow-md shadow-brand-500/10 cursor-pointer"
            >
              <Zap size={16} /> Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-cloud-100 transition hover:bg-white/10 cursor-pointer"
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>
          </div>
        </div>
      </section>

      {/* 13. RELATED PRODUCTS */}
      <RelatedProducts categoryId={product.category?._id} excludeId={product._id} />
    </div>
  )
}
