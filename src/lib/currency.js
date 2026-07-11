// All prices are stored in the database as plain INR numbers (no currency
// code needed — this is a single-currency storefront).
export function formatINR(amount) {
  const n = Math.round(Number(amount) || 0)
  return `₹${n.toLocaleString("en-IN")}`
}
