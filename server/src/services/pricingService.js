import { ApiError } from "../utils/apiError.js"
import Product from "../models/Product.js"

// Recomputes item prices from the live Product record — client-sent prices
// are never trusted. Used by order creation and by coupon discount
// calculation, which both need the same "what does this cart actually cost"
// answer.
export async function buildPricedItems(items) {
  const productIds = items.map((i) => i.productId)
  const products = await Product.find({ _id: { $in: productIds }, status: "published" })

  if (products.length !== new Set(productIds).size) {
    throw new ApiError(400, "One or more items are no longer available")
  }

  const productById = new Map(products.map((p) => [String(p._id), p]))
  return items.map((i) => {
    const product = productById.get(i.productId)
    const qty = Math.max(1, Number(i.qty) || 1)
    return {
      product: product._id,
      name: product.name,
      price: product.salePrice ?? product.price,
      qty,
    }
  })
}
