import { ApiError } from "../utils/apiError.js"
import Coupon from "../models/Coupon.js"
import Order from "../models/Order.js"

// Single source of truth for "is this coupon usable, and what does it save".
// Called both by the public preview endpoint (apply-as-you-type at
// checkout) and by order creation (authoritative, re-checked server-side)
// so the two can never disagree about whether a coupon is valid.
export async function resolveCoupon(code, pricedItems, userId) {
  const normalized = String(code || "").trim().toUpperCase()
  if (!normalized) {
    throw new ApiError(400, "Coupon code is required")
  }

  const coupon = await Coupon.findOne({ code: normalized })
  if (!coupon || coupon.status !== "active") {
    throw new ApiError(400, "Invalid coupon code")
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "This coupon has expired")
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "This coupon has reached its usage limit")
  }
  if (coupon.perCustomerLimit && userId) {
    const alreadyUsed = await Order.exists({ user: userId, couponCode: normalized })
    if (alreadyUsed) {
      throw new ApiError(400, "You have already used this coupon")
    }
  }

  const matchedItems =
    coupon.appliesTo === "all"
      ? pricedItems
      : pricedItems.filter((item) =>
          coupon.products.some((productId) => String(productId) === String(item.product))
        )

  if (matchedItems.length === 0) {
    throw new ApiError(400, "This coupon isn't valid for the items in your cart")
  }

  const matchedSubtotal = matchedItems.reduce((sum, item) => sum + item.price * item.qty, 0)

  if (coupon.minOrderValue != null && matchedSubtotal < coupon.minOrderValue) {
    throw new ApiError(400, `This coupon requires a minimum order of ₹${coupon.minOrderValue}`)
  }

  const discountAmount =
    coupon.discountType === "percentage"
      ? Math.round((matchedSubtotal * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, matchedSubtotal)

  return {
    coupon,
    discountAmount,
    matchedProductIds: matchedItems.map((item) => String(item.product)),
  }
}
