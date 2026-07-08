// Maps a "tone" key to a pair of gradient stops used for icon tiles / avatars.
// Applied via inline style so Tailwind's JIT never purges them.
const TONES = {
  violet: ["#8b5cf6", "#6d28d9"],
  indigo: ["#6366f1", "#4338ca"],
  pink: ["#ec4899", "#be185d"],
  fuchsia: ["#d946ef", "#a21caf"],
  teal: ["#14b8a6", "#0f766e"],
  cyan: ["#06b6d4", "#0e7490"],
  sky: ["#38bdf8", "#0284c7"],
  blue: ["#3b82f6", "#1d4ed8"],
  amber: ["#f59e0b", "#b45309"],
  orange: ["#fb923c", "#ea580c"],
  rose: ["#fb7185", "#e11d48"],
  red: ["#ef4444", "#b91c1c"],
  emerald: ["#10b981", "#047857"],
  lime: ["#84cc16", "#4d7c0f"],
}

export const TONE_KEYS = Object.keys(TONES)

export function toneGradient(tone = "violet", angle = 135) {
  const [from, to] = TONES[tone] || TONES.violet
  return { backgroundImage: `linear-gradient(${angle}deg, ${from}, ${to})` }
}

export function toneSoft(tone = "violet") {
  const [from] = TONES[tone] || TONES.violet
  return {
    backgroundColor: `${from}1f`,
    boxShadow: `inset 0 0 0 1px ${from}33`,
  }
}

export function toneColor(tone = "violet") {
  return (TONES[tone] || TONES.violet)[0]
}
