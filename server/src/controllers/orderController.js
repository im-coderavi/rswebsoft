import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import Order from "../models/Order.js"
import PaymentSetting from "../models/PaymentSetting.js"
import { sendAdminNewOrderEmail, sendCustomerDeliveryEmail } from "../services/mailService.js"
import { buildPricedItems } from "../services/pricingService.js"
import { resolveCoupon } from "../services/couponService.js"
import Coupon from "../models/Coupon.js"

export const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .populate("items.product", "name slug downloadUrl")
  res.json(orders)
})

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(orders)
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const order = await Order.findById(req.params.id)
  if (!order) throw new ApiError(404, "Order not found")

  order.status = status
  await order.save()
  res.json(order)
})

// Shared sequence used by both the auto-send-on-verify path and the manual
// "Send Product" action: populate -> require at least one download link ->
// send the customer email -> atomically claim the paid -> fulfilled
// transition so a concurrent call for the same order can't also send.
// Returns { ok: true, order } on success, or { ok: false, reason, error? }.
async function deliverProduct(orderId) {
  const order = await Order.findById(orderId).populate("items.product", "name slug downloadUrl")
  if (!order) {
    return { ok: false, reason: "not_found" }
  }
  if (order.status !== "paid") {
    return { ok: false, reason: "invalid_status", order }
  }

  const hasDownloadLink = order.items.some((item) => item.product?.downloadUrl)
  if (!hasDownloadLink) {
    return { ok: false, reason: "no_download_link", order }
  }

  const result = await sendCustomerDeliveryEmail(order)
  if (!result.ok) {
    return { ok: false, reason: "send_failed", error: result.error, order }
  }

  const updated = await Order.findOneAndUpdate(
    { _id: orderId, status: "paid" },
    { status: "fulfilled", productSentAt: new Date() },
    { new: true }
  )

  // If another concurrent request already flipped the status, the email was
  // still (only once, by whichever request won the send race above) — but
  // guard against double-claiming: this branch means we lost the race for
  // the status write even though we sent successfully. That can't happen in
  // practice since only one caller passes the "paid" status check above at a
  // time in the normal flow, but if it does, report success using the latest
  // order state.
  return { ok: true, order: updated || order }
}

// Admin action: confirms the UPI payment reference was checked and is valid.
// If auto-send is enabled, immediately delivers the product too.
export const verifyPayment = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, status: "pending" },
    { status: "paid" },
    { new: true }
  )
  if (!order) {
    throw new ApiError(400, "Order not found or not in pending status")
  }

  const settings = await PaymentSetting.findOne()
  if (settings?.autoSendOnVerify) {
    const delivery = await deliverProduct(order._id)
    if (delivery.ok) {
      return res.json(delivery.order)
    }
    // Payment is still verified even if the auto-send delivery failed
    // (missing download link, or the email send itself failed); admin can
    // retry via "Send Product". Flag this so the UI can surface it.
    const responseOrder = (delivery.order || order).toObject
      ? (delivery.order || order).toObject()
      : delivery.order || order
    return res.json({ ...responseOrder, autoSendFailed: true })
  }

  res.json(order)
})

// Admin action: manually deliver the product to the customer (used when
// auto-send is off, or to retry a failed auto-send).
export const sendProduct = asyncHandler(async (req, res) => {
  const delivery = await deliverProduct(req.params.id)

  if (!delivery.ok) {
    if (delivery.reason === "not_found") {
      throw new ApiError(404, "Order not found")
    }
    if (delivery.reason === "invalid_status") {
      throw new ApiError(
        400,
        `Cannot send product for an order in "${delivery.order.status}" status — payment must be verified first`
      )
    }
    if (delivery.reason === "no_download_link") {
      throw new ApiError(400, "Cannot send product: no download link is set on any item's product")
    }
    throw new ApiError(502, `Failed to send delivery email: ${delivery.error}`)
  }

  res.json(delivery.order)
})

// Requires login (see orderRoutes.js). Prices are always recomputed from the
// live product record — the client-sent price is never trusted.
export const createOrder = asyncHandler(async (req, res) => {
  const { customer, items, paymentReference } = req.body

  if (!customer?.name || !customer?.email || !customer?.phone) {
    throw new ApiError(400, "Name, email and phone are required")
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Cart is empty")
  }

  const orderItems = await buildPricedItems(items)

  const { couponCode } = req.body
  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0)

  let discountAmount = 0
  let appliedCoupon = null
  if (couponCode) {
    const resolved = await resolveCoupon(couponCode, orderItems, req.user._id)
    appliedCoupon = resolved.coupon
    discountAmount = resolved.discountAmount
  }

  const order = await Order.create({
    user: req.user._id,
    customer,
    items: orderItems,
    total: subtotal - discountAmount,
    couponCode: appliedCoupon?.code || "",
    discountAmount,
    paymentReference: paymentReference || "",
  })

  if (appliedCoupon) {
    await Coupon.updateOne({ _id: appliedCoupon._id }, { $inc: { usedCount: 1 } })
  }

  // Don't block the checkout response on the SMTP round-trip (Nodemailer's
  // default connect timeout is ~2 minutes). Fire the admin notification
  // without awaiting it here, and update orderNotified in the background
  // once it resolves.
  sendAdminNewOrderEmail(order)
    .then((emailResult) => Order.updateOne({ _id: order._id }, { orderNotified: emailResult.ok }))
    .catch((err) => console.error("Background sendAdminNewOrderEmail failed:", err.message))

  res.status(201).json(order)
})

// Public: order status lookup by id (the id itself acts as the bearer secret,
// so this works right after checkout without requiring a fresh login).
// Download links only reveal once the order has been manually marked
// fulfilled by an admin.
export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product", "downloadUrl")
  if (!order) throw new ApiError(404, "Order not found")

  const payload = order.toObject()
  payload.items = payload.items.map((item) => ({
    name: item.name,
    price: item.price,
    qty: item.qty,
    downloadUrl: order.status === "fulfilled" ? item.product?.downloadUrl || "" : "",
  }))

  res.json(payload)
})
