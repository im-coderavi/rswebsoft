import { Link } from "react-router-dom"
import { Check } from "lucide-react"
import { useProducts } from "../../hooks/useProducts"
import { cleanText } from "../../lib/text"

function PricingCard({ product }) {
  const isMostPopular = product.tags?.some(t => t.toLowerCase() === "most popular")
  const promoTag = product.tags?.find(t => t.toLowerCase() !== "most popular")
  
  const isCustomQuote = product.salePrice === 0 || product.price === 0 || !product.salePrice || product.name.toLowerCase().includes("custom")
  
  const originalPrice = product.price
  const offerPrice = product.salePrice || product.price
  
  const gstAmount = Math.round(offerPrice * 0.18)
  const totalPayable = offerPrice + gstAmount

  const formatINR = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0
    }).format(amount)
  }

  const hasDemoUrl = Boolean(product.demoUrl)

  const shortDescription = cleanText(product.shortDescription) || "Tailored solution for your business"
  const ctaSubtext = cleanText(product.description) || "Talk to a web expert"

  return (
    <div className={`relative flex min-w-0 flex-col justify-between rounded-xl bg-white text-slate-800 shadow-md border transition-all duration-300 hover:shadow-xl ${isMostPopular ? "border-emerald-500 border-2 ring-1 ring-emerald-200" : "border-slate-300"}`}>

      {/* Most Popular Top Badge */}
      {isMostPopular && (
        <div className="relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
            <span className="inline-block rounded-full bg-emerald-500 px-3.5 py-1 text-xs font-bold text-white shadow-md">
              ⭐ MOST POPULAR
            </span>
          </div>
        </div>
      )}

      {/* Plan Details */}
      <div className={`min-w-0 p-6 flex flex-col flex-1 ${isMostPopular ? "pt-10" : ""}`}>
        <div className="text-left mb-6">
          {/* Type Badge */}
          {product.type && (
            <div className="mb-2">
              <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">
                {product.type === "package" ? "WEB PACKAGE" : product.type.toUpperCase()}
              </span>
            </div>
          )}
          <h3 className="font-display text-lg font-bold text-slate-900 break-words leading-tight">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-xs text-slate-600 font-normal break-words leading-relaxed">
            {shortDescription}
          </p>
        </div>

        {/* Pricing Details */}
        <div className="rounded-lg bg-slate-50 p-4 text-left border border-slate-200 mb-5">
          {isCustomQuote ? (
            <div>
              <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-2">Custom Quote</div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-display text-3xl font-bold text-slate-900">Custom</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-200 px-2 py-0.5 rounded">
                  Pricing
                </span>
              </div>
              <div className="text-xs text-slate-600">+ 18% GST Applicable</div>
            </div>
          ) : (
            <div>
              <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Price</div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-display text-3xl font-bold text-slate-900">₹{formatINR(offerPrice)}</span>
                {originalPrice > offerPrice && (
                  <span className="text-xs text-slate-500 line-through">₹{formatINR(originalPrice)}</span>
                )}
                {promoTag && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {promoTag}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-600">+ 18% GST: ₹{formatINR(gstAmount)} = <span className="font-bold text-emerald-600">₹{formatINR(totalPayable)}</span></div>
            </div>
          )}
        </div>

        {/* Features Checklist */}
        <ul className="space-y-2 pb-6 border-b border-slate-200 text-left flex-1">
          {product.features?.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-normal leading-snug">
              <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="line-clamp-2 break-words">{cleanText(feature)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Button Action CTA */}
      <div className="px-6 py-6 mt-auto">
        {isCustomQuote ? (
          hasDemoUrl ? (
            <a
              href={product.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-lg border-2 border-emerald-500 py-2.5 px-4 text-sm font-bold text-emerald-600 transition hover:bg-emerald-50 text-center"
            >
              Chat on WhatsApp
            </a>
          ) : (
            <Link
              to="/support"
              className="block w-full rounded-lg border-2 border-emerald-500 py-2.5 px-4 text-sm font-bold text-emerald-600 transition hover:bg-emerald-50 text-center"
            >
              Chat on WhatsApp
            </Link>
          )
        ) : hasDemoUrl ? (
          <a
            href={product.demoUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-lg bg-emerald-600 py-3 px-4 text-white transition hover:bg-emerald-700 font-bold text-center"
          >
            Buy on WhatsApp
          </a>
        ) : (
          <Link
            to="/support"
            className="block w-full rounded-lg bg-emerald-600 py-3 px-4 text-white transition hover:bg-emerald-700 font-bold text-center"
          >
            Buy on WhatsApp
          </Link>
        )}
      </div>
    </div>
  )
}

export default function PricingPlans() {
  const { data, isLoading } = useProducts({
    type: "package",
    status: "published",
    limit: 150
  })

  const packages = data?.items || []

  if (!isLoading && packages.length === 0) return null

  // Only the 3 cheapest published "package" products show here — admin
  // controls which 3 plans these are (and what's in them) through the
  // Products admin panel.
  const displayPackages = [...packages]
    .sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price))
    .slice(0, 3)

  return (
    <section className="scroll-mt-32 py-16 sm:py-20">
      <div className="container-rs text-center mb-12 sm:mb-16">
        <h2 className="font-display text-3xl font-bold tracking-tight text-cloud-100 sm:text-4xl">
          Web Development <span className="text-emerald-400">Packages &amp; Pricing</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-cloud-400 sm:text-base">
          Choose a plan that fits your business. All packages include domain, hosting, security and dedicated support.
        </p>
      </div>

      <div className="container-rs">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <p className="text-sm text-cloud-500 animate-pulse">Loading pricing plans…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto auto-rows-fr">
            {displayPackages.map((p) => (
              <PricingCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
