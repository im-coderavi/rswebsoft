import { useState, useEffect } from "react"
import { 
  X, 
  Monitor, 
  Tablet, 
  Smartphone, 
  ExternalLink, 
  MessageSquare, 
  Zap, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  PhoneCall
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useCart } from "../../context/CartContext"
import { formatINR } from "../../lib/currency"
import toast from "react-hot-toast"

export default function ProductPreviewModal({ product, isOpen, onClose }) {
  const navigate = useNavigate()
  const { add } = useCart()
  const [deviceView, setDeviceView] = useState("desktop") // desktop | tablet | mobile
  const [activeImgIdx, setActiveImgIdx] = useState(0)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.body.style.overflow = "auto"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !product) return null

  const images = product.images || []
  const activeImage = images[activeImgIdx]?.url || images[0]?.url
  const onSale = product.salePrice != null && product.salePrice < product.price
  const effectivePrice = onSale ? product.salePrice : product.price

  const hasExternalDemo = Boolean(
    product.demoUrl && 
    (product.demoUrl.startsWith("http://") || product.demoUrl.startsWith("https://"))
  )

  const whatsappMessage = encodeURIComponent(
    `Hi RS WebSoft! I would like a live demo preview of: ${product.name}`
  )
  const whatsappUrl = `https://wa.me/919876543210?text=${whatsappMessage}`

  function handleBuyNow() {
    add(
      {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        image: activeImage || "",
        price: effectivePrice,
      },
      1
    )
    onClose()
    navigate("/checkout")
  }

  function handleNextImg() {
    if (images.length > 0) {
      setActiveImgIdx((prev) => (prev + 1) % images.length)
    }
  }

  function handlePrevImg() {
    if (images.length > 0) {
      setActiveImgIdx((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-ink-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 bg-ink-900/90 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300">
              <Sparkles size={16} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-display text-sm font-bold text-cloud-100 sm:text-base">
                  {product.name}
                </h3>
                <span className="hidden sm:inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  Live Preview
                </span>
              </div>
              <p className="text-[11px] text-cloud-400 truncate">
                {product.category?.name || "WordPress & Web Template"}
              </p>
            </div>
          </div>

          {/* DEVICE VIEW SWITCHER (Desktop, Tablet, Mobile) */}
          <div className="hidden md:flex items-center gap-1 rounded-xl bg-ink-950 p-1 border border-white/10">
            <button
              onClick={() => setDeviceView("desktop")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                deviceView === "desktop" 
                  ? "bg-brand-500 text-white shadow-sm" 
                  : "text-cloud-400 hover:text-cloud-100"
              }`}
            >
              <Monitor size={14} /> Desktop
            </button>
            <button
              onClick={() => setDeviceView("tablet")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                deviceView === "tablet" 
                  ? "bg-brand-500 text-white shadow-sm" 
                  : "text-cloud-400 hover:text-cloud-100"
              }`}
            >
              <Tablet size={14} /> Tablet
            </button>
            <button
              onClick={() => setDeviceView("mobile")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                deviceView === "mobile" 
                  ? "bg-brand-500 text-white shadow-sm" 
                  : "text-cloud-400 hover:text-cloud-100"
              }`}
            >
              <Smartphone size={14} /> Mobile
            </button>
          </div>

          {/* CLOSE & EXTERNAL BUTTONS */}
          <div className="flex items-center gap-2">
            {hasExternalDemo && (
              <a
                href={product.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-bold text-cloud-100 hover:bg-white/20 transition"
              >
                <ExternalLink size={13} /> Full Site Demo
              </a>
            )}
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl bg-white/5 border border-white/10 text-cloud-400 hover:bg-white/10 hover:text-cloud-100 transition cursor-pointer"
              aria-label="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL MAIN CONTENT VIEWPORT */}
        <div className="relative flex flex-1 items-center justify-center overflow-y-auto bg-ink-950/90 p-4 sm:p-6">
          
          {/* DEVICE PREVIEW CONTAINER CONTAINER */}
          <div 
            className={`transition-all duration-300 mx-auto flex flex-col items-center justify-center h-full w-full ${
              deviceView === "mobile" 
                ? "max-w-[380px]" 
                : deviceView === "tablet" 
                ? "max-w-[768px]" 
                : "max-w-full"
            }`}
          >
            {/* MOCK BROWSER FRAME */}
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/15 bg-ink-900 shadow-2xl">
              
              {/* Browser Window Header */}
              <div className="flex items-center justify-between bg-ink-950 px-4 py-2.5 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="mx-4 flex h-6 flex-1 max-w-xl items-center rounded-lg bg-ink-850 px-3 text-xs text-cloud-400 font-mono truncate select-none border border-white/5">
                  https://demo.rswebsoft.in/{product.slug}
                </div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  SSL Secure
                </div>
              </div>

              {/* Viewport Content Area */}
              <div className="relative flex-1 overflow-y-auto bg-ink-950 group">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-auto object-top transition-all duration-300"
                  />
                ) : (
                  <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-brand-900/40 to-ink-900 text-cloud-300 font-bold text-sm">
                    No preview screenshot available
                  </div>
                )}

                {/* Left / Right Navigation Controls for Image Gallery */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white opacity-80 hover:opacity-100 hover:scale-110 transition cursor-pointer shadow-lg"
                      aria-label="Previous Image"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={handleNextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white opacity-80 hover:opacity-100 hover:scale-110 transition cursor-pointer shadow-lg"
                      aria-label="Next Image"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* THUMBNAILS & FOOTER BAR */}
        <div className="flex flex-col gap-3 border-t border-white/10 bg-ink-900/90 p-4 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Thumbnails Gallery Picker */}
          {images.length > 1 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`relative h-11 w-16 shrink-0 overflow-hidden rounded-lg border transition cursor-pointer ${
                    activeImgIdx === idx 
                      ? "border-brand-400 ring-2 ring-brand-500/40" 
                      : "border-white/10 opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt={`Thumb ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-cloud-400">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Full Source Code &amp; Documentation Included</span>
            </div>
          )}

          {/* Price & Action CTAs */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-cloud-400 uppercase font-bold tracking-wider">Price</span>
              <span className="font-display text-lg font-black text-cloud-100">
                {formatINR(effectivePrice)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20"
              >
                <MessageSquare size={14} /> Request Live Demo
              </a>

              <button
                onClick={handleBuyNow}
                className="flex items-center gap-1.5 rounded-xl bg-brand-gradient px-5 py-2.5 text-xs font-extrabold text-white transition hover:opacity-95 shadow-lg shadow-brand-500/20 cursor-pointer"
              >
                <Zap size={15} fill="currentColor" /> Buy Now
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
