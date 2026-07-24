const TONE_CLASSES = {
  success: "bg-emerald-500/15 text-emerald-400",
  neutral: "bg-white/5 text-cloud-500",
  danger: "bg-rose-500/15 text-rose-400",
  warning: "bg-amber-500/15 text-amber-400",
  brand: "bg-brand-500/15 text-brand-300",
}

export default function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}>
      {children}
    </span>
  )
}
