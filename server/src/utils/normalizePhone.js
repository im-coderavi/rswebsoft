// The storefront is India-only (INR prices, UPI payments), so a valid phone
// here is a 10-digit Indian mobile number. Customers type it in many shapes —
// "+91 98765 43210", "098765-43210", "9876543210" — and all of them must
// resolve to the same stored value, otherwise phone login silently fails for
// anyone who types it differently than they did at signup.
//
// If the shop ever sells outside India, this is the only function to change.
export function normalizePhone(raw) {
  if (typeof raw !== "string") return null

  let digits = raw.replace(/\D/g, "")

  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1)

  if (digits.length !== 10) return null
  if (!/^[6-9]/.test(digits)) return null

  return digits
}
