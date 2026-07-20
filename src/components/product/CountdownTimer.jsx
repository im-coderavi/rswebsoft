import { useEffect, useState } from "react"
import { Flame } from "lucide-react"

function getRemaining(target) {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

function Digit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-ink-900 font-display text-lg font-bold text-cloud-100 sm:h-12 sm:w-12">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-wide text-cloud-500">{label}</span>
    </div>
  )
}

export default function CountdownTimer({ target }) {
  const [remaining, setRemaining] = useState(() => (target ? getRemaining(target) : null))

  useEffect(() => {
    if (!target) return
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  if (!target || !remaining) return null

  return (
    <div className="flex items-center gap-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3">
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-rose-300">
        <Flame size={16} /> Sale ends in
      </span>
      <div className="flex items-center gap-2">
        {remaining.days > 0 && <Digit value={remaining.days} label="Days" />}
        <Digit value={remaining.hours} label="Hrs" />
        <Digit value={remaining.minutes} label="Min" />
        <Digit value={remaining.seconds} label="Sec" />
      </div>
    </div>
  )
}
