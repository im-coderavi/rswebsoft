import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import Coupon from "../models/Coupon.js"
import User from "../models/User.js"
import { buildPricedItems } from "../services/pricingService.js"
import { resolveCoupon } from "../services/couponService.js"

export const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).populate("products", "name")
  res.json(coupons)
})

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body)
  res.status(201).json(coupon)
})

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
  if (!coupon) throw new ApiError(404, "Coupon not found")

  Object.assign(coupon, req.body)
  await coupon.save()
  res.json(coupon)
})

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id)
  if (!coupon) throw new ApiError(404, "Coupon not found")
  res.json({ message: "Coupon deleted" })
})

// The Cart page (unlike Checkout) is reachable while logged out, so this
// endpoint can't require auth outright. It still attaches the user id when a
// valid token IS present, so the per-customer-limit check works for signed-in
// shoppers previewing a coupon on the Cart page. A missing/invalid token just
// means that one check is skipped for this preview call — it's re-enforced
// unconditionally at order creation, which does require login.
async function optionalUserId(req) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) return null
  try {
    const payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET)
    const user = await User.findById(payload.id)
    return user ? String(user._id) : null
  } catch {
    return null
  }
}

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, items } = req.body
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Cart is empty")
  }

  const pricedItems = await buildPricedItems(items)
  const userId = await optionalUserId(req)
  const { discountAmount, matchedProductIds } = await resolveCoupon(code, pricedItems, userId)

  res.json({ discountAmount, matchedProductIds })
})
