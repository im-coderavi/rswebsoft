import { Loader2 } from "lucide-react"

const VARIANT_CLASSES = {
  primary: "bg-brand-gradient text-white hover:opacity-95",
  secondary: "border border-white/10 text-cloud-300 hover:bg-white/5",
  ghost: "text-cloud-400 hover:bg-ink-800 hover:text-cloud-100",
  danger: "text-cloud-400 hover:bg-rose-500/15 hover:text-rose-400",
}

export default function Button({
  variant = "primary",
  icon: IconComp,
  loading = false,
  iconOnly = false,
  className = "",
  children,
  disabled,
  ...rest
}) {
  const shape = iconOnly
    ? "grid h-8 w-8 place-items-center rounded-lg"
    : "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"

  return (
    <button
      disabled={disabled || loading}
      className={`transition disabled:cursor-not-allowed disabled:opacity-60 ${shape} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconOnly ? 15 : 16} className="animate-spin" />
      ) : IconComp ? (
        <IconComp size={iconOnly ? 15 : 16} />
      ) : null}
      {!iconOnly && children}
    </button>
  )
}
