import { Sparkles, ChevronDown } from "lucide-react"

export default function AnnouncementBar() {
  return (
    <div className="bg-brand-gradient text-white">
      <div className="container-rs flex h-9 items-center justify-between gap-4 text-xs sm:text-[13px]">
        <p className="flex min-w-0 flex-1 items-center gap-1.5 font-medium">
          <Sparkles size={14} className="shrink-0" />
          <span className="truncate">
            Special Offer! Get 20% OFF on All Products – Limited Time Deal!
          </span>
        </p>
        <div className="hidden items-center gap-5 md:flex">
          <a href="#" className="text-white/85 transition hover:text-white">About Us</a>
          <a href="#" className="text-white/85 transition hover:text-white">Help Center</a>
          <a href="#" className="text-white/85 transition hover:text-white">Contact Us</a>
          <button className="flex items-center gap-1 text-white/85 transition hover:text-white">
            English <ChevronDown size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
