import RateLimit from "../models/RateLimit.js"

// Counts one hit against `key` and says whether the caller is over `limit`
// within `windowMs`. The window starts at the first hit and the document
// expires on its own, so there is nothing to sweep up.
//
// Atomic: the upsert and the increment are one operation, so two requests
// arriving together can't both read the old count and slip past the cap.
export async function hitRateLimit(key, { limit, windowMs }) {
  const now = new Date()

  const record = await RateLimit.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(now.getTime() + windowMs) },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return {
    allowed: record.count <= limit,
    count: record.count,
    retryAfterMs: Math.max(0, record.expiresAt.getTime() - now.getTime()),
  }
}
