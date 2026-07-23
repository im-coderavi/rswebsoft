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
    <div className={`relative flex min-w-0 flex-col justify-between overflow-hidden rounded-3xl bg-white text-slate-800 p-8 shadow-md border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${isMostPopular ? "border-emerald-500 ring-4 ring-emerald-500/10 scale-102 z-10" : "border-slate-100"}`}>

      {/* Most Popular Top Badge */}
      {isMostPopular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
          Most Popular
        </span>
      )}

      {/* Plan Details */}
      <div className="min-w-0">
        <div className="text-left mb-4">
          <h3 className="font-display text-xl font-extrabold text-slate-900 break-words sm:text-2xl">
            {product.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs text-slate-500 font-medium break-words">
            {shortDescription}
          </p>
        </div>

        {/* Pricing Details */}
        <div className="my-6 rounded-2xl bg-slate-50 p-5 text-left border border-slate-100/80">
          {isCustomQuote ? (
            <div>
              <div className="text-[10px] font-bold text-slate-400 line-through">MRP: ₹{formatINR(originalPrice)}</div>
              <div className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase mt-0.5">Custom Quote</div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-display text-3xl font-black text-slate-900">Contact</span>
                <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                  Fully Custom
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-semibold">+ 18% GST Applicable</div>
              <div className="text-[10px] font-black text-slate-600">Total: —</div>
            </div>
          ) : (
            <div>
              <div className="text-[10px] font-bold text-slate-400 line-through">MRP: ₹{formatINR(originalPrice)}</div>
              <div className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase mt-0.5">Offer Price</div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-display text-3xl font-black text-slate-900">₹{formatINR(offerPrice)}</span>
                {promoTag && (
                  <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                    {promoTag}
                  </span>
                )}
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-semibold">+ 18% GST: ₹{formatINR(gstAmount)}</div>
              <div className="text-[10px] font-black text-slate-950 mt-0.5">
                Total Payable: <span className="text-emerald-600 font-bold">₹{formatINR(totalPayable)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Features Checklist */}
        <ul className="space-y-3 pb-6 border-b border-slate-100 text-left">
          {product.features?.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 font-medium leading-tight">
              <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span className="line-clamp-2 break-words">{cleanText(feature)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Button Action CTA */}
      <div className="mt-8 text-center">
        {isCustomQuote ? (
          hasDemoUrl ? (
            <a
              href={product.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-xl border-2 border-emerald-500 py-3 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50 text-center"
            >
              Discuss Your Requirements
            </a>
          ) : (
            <Link
              to="/support"
              className="block w-full rounded-xl border-2 border-emerald-500 py-3 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50 text-center"
            >
              Discuss Your Requirements
            </Link>
          )
        ) : hasDemoUrl ? (
          <a
            href={product.demoUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-md shadow-emerald-700/10 text-center"
          >
            <div className="font-extrabold text-sm">Get Started</div>
            <div className="line-clamp-1 break-words text-[9px] font-medium text-emerald-100/90 tracking-wide mt-0.5 uppercase">
              {ctaSubtext}
            </div>
          </a>
        ) : (
          <Link
            to="/support"
            className="block w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-md shadow-emerald-700/10 text-center"
          >
            <div className="font-extrabold text-sm">Get Started</div>
            <div className="line-clamp-1 break-words text-[9px] font-medium text-emerald-100/90 tracking-wide mt-0.5 uppercase">
              {ctaSubtext}
            </div>
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

  // Shows every published "package" product, cheapest first — admin controls
  // how many plans exist and what's in them entirely through the Products
  // admin panel, no fixed slot count here.
  const displayPackages = [...packages].sort(
    (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price)
  )

  return (
    <section className="scroll-mt-32 py-16 sm:py-20 bg-ink-950/20">
      <div className="container-rs text-center mb-12 sm:mb-16">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl lg:text-4xl">
          Web Development <span className="text-emerald-400">Packages &amp; Pricing</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-xs font-medium text-cloud-400 sm:text-sm md:text-base">
          Choose a plan that fits your business. All packages include domain, hosting, security and dedicated support.
        </p>
      </div>

      <div className="container-rs">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <p className="text-sm text-cloud-500 animate-pulse">Loading pricing plans…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto items-stretch">
            {displayPackages.map((p) => (
              <PricingCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
