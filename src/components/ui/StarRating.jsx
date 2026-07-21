import { Star } from "lucide-react"

// Compact rating: single gold star + numeric value + review count.
export default function StarRating({ rating, reviews }) {
  const numRating = typeof rating === "number" ? rating : parseFloat(rating)
  const formattedRating = !isNaN(numRating) && numRating > 0 ? numRating.toFixed(1) : "5.0"

  return (
    <span className="inline-flex items-center gap-1 text-xs text-cloud-400">
      <Star size={13} className="fill-star text-star shrink-0" />
      <span className="font-semibold text-cloud-100">{formattedRating}</span>
      {reviews != null && <span>({reviews.toLocaleString()})</span>}
    </span>
  )
}

// Full 5-star row (used in testimonials).
export function StarRow({ rating = 5, size = 15 }) {
  const numRating = typeof rating === "number" ? rating : parseFloat(rating) || 5
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.floor(numRating) ? "fill-star text-star" : "text-ink-600"}
        />
      ))}
    </span>
  )
}

