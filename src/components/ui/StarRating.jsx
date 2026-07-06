import { Star } from "lucide-react"

// Compact rating: single gold star + numeric value + review count.
export default function StarRating({ rating, reviews }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-cloud-400">
      <Star size={13} className="fill-star text-star" />
      <span className="font-semibold text-cloud-100">{rating}</span>
      {reviews != null && <span>({reviews.toLocaleString()})</span>}
    </span>
  )
}

// Full 5-star row (used in testimonials).
export function StarRow({ rating = 5, size = 15 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? "fill-star text-star" : "text-ink-600"}
        />
      ))}
    </span>
  )
}
