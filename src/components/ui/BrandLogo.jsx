import { useState } from "react"
import Icon from "./Icon"
import { toneGradient } from "../../lib/tones"

// Falls back to the tone-gradient icon chip whenever brand.logo.url is
// missing OR fails to actually load (broken link, 404, wrong path) — a
// bare <img> would otherwise show the browser's broken-image glyph.
export default function BrandLogo({ brand }) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(brand.logo?.url) && !failed

  if (showImage) {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink-800">
        <img
          src={brand.logo.url}
          alt=""
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      </span>
    )
  }

  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
      style={toneGradient(brand.tone)}
    >
      <Icon name={brand.icon} size={20} />
    </span>
  )
}
