import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import Order from "../models/Order.js"
import Product from "../models/Product.js"
import PaymentSetting from "../models/PaymentSetting.js"
import { sendAdminNewOrderEmail, sendCustomerDeliveryEmail } from "../services/mailService.js"

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

// Admin action: confirms the UPI payment reference was checked and is valid.
// If auto-send is enabled, immediately delivers the product too.
export const verifyPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) throw new ApiError(404, "Order not found")
  if (order.status !== "pending") {
    throw new ApiError(400, `Cannot verify payment for an order in "${order.status}" status`)
  }

  order.status = "paid"
  await order.save()

  const settings = await PaymentSetting.findOne()
  if (settings?.autoSendOnVerify) {
    const populated = await Order.findById(order._id).populate("items.product", "name slug downloadUrl")
    const result = await sendCustomerDeliveryEmail(populated)
    if (result.ok) {
      populated.status = "fulfilled"
      populated.productSentAt = new Date()
      await populated.save()
      return res.json(populated)
    }
    // Payment is still verified even if the auto-send email failed; admin can retry via "Send Product".
    return res.json(order)
  }

  res.json(order)
})

// Admin action: manually deliver the product to the customer (used when
// auto-send is off, or to retry a failed auto-send).
export const sendProduct = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product", "name slug downloadUrl")
  if (!order) throw new ApiError(404, "Order not found")
  if (order.status !== "paid") {
    throw new ApiError(400, `Cannot send product for an order in "${order.status}" status — payment must be verified first`)
  }

  const result = await sendCustomerDeliveryEmail(order)
  if (!result.ok) {
    throw new ApiError(502, `Failed to send delivery email: ${result.error}`)
  }

  order.status = "fulfilled"
  order.productSentAt = new Date()
  await order.save()
  res.json(order)
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

  const productIds = items.map((i) => i.productId)
  const products = await Product.find({ _id: { $in: productIds }, status: "published" })

  if (products.length !== new Set(productIds).size) {
    throw new ApiError(400, "One or more items are no longer available")
  }

  const productById = new Map(products.map((p) => [String(p._id), p]))
  const orderItems = items.map((i) => {
    const product = productById.get(i.productId)
    const qty = Math.max(1, Number(i.qty) || 1)
    return {
      product: product._id,
      name: product.name,
      price: product.salePrice ?? product.price,
      qty,
    }
  })

  const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0)

  const order = await Order.create({
    user: req.user._id,
    customer,
    items: orderItems,
    total,
    paymentReference: paymentReference || "",
  })

  const emailResult = await sendAdminNewOrderEmail(order)
  order.orderNotified = emailResult.ok
  await order.save()

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
