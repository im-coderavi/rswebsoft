import Licence from "../models/Licence.js"
import Product from "../models/Product.js"
import { generateLicenceKey } from "../utils/generateLicenceKey.js"

// How many recent reveals to keep on a licence document.
const ACCESS_LOG_LIMIT = 50

// Distinct addresses beyond which the admin list marks a licence as worth a
// look. Deliberately a hint and not an automatic block: mobile carriers rotate
// addresses, so a real customer can cross this without doing anything wrong.
export const SHARING_HINT_IP_COUNT = 5

// Issues one licence per order item that actually has a file behind it.
// Idempotent on (order, product): re-sending a delivery email reuses the key
// the customer already has rather than invalidating it.
export async function issueLicencesForOrder(order) {
  const productIds = order.items.map((item) => item.product?._id ?? item.product).filter(Boolean)

  // downloadUrl is select:false, so it has to be asked for explicitly.
  const products = await Product.find({ _id: { $in: productIds } }).select("+downloadUrl name")
  const deliverable = new Map(
    products.filter((p) => p.downloadUrl?.trim()).map((p) => [String(p._id), p])
  )

  const licences = []
  for (const item of order.items) {
    const productId = String(item.product?._id ?? item.product ?? "")
    const product = deliverable.get(productId)
    if (!product) continue

    const existing = await Licence.findOne({ order: order._id, product: productId })
    if (existing) {
      licences.push(existing)
      continue
    }

    licences.push(await createWithUniqueKey({ order, productId, product, item }))
  }

  return licences
}

// Retries past the unique-key race rather than failing the delivery.
async function createWithUniqueKey({ order, productId, product, item }) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await Licence.create({
        key: generateLicenceKey(),
        order: order._id,
        user: order.user,
        product: productId,
        productName: item.name || product.name,
      })
    } catch (err) {
      // Another delivery for the same order+product won the race — use theirs.
      if (err?.code === 11000 && err?.keyPattern?.order) {
        const existing = await Licence.findOne({ order: order._id, product: productId })
        if (existing) return existing
      }
      if (!(err?.code === 11000 && err?.keyPattern?.key)) throw err
    }
  }
  throw new Error("Could not allocate a licence key")
}

// Records one reveal. `$addToSet` on the address keeps the sharing signal
// meaningful, `$slice` keeps the log from growing without bound.
export async function recordLicenceAccess(licence, { ip, userAgent }) {
  return Licence.findByIdAndUpdate(
    licence._id,
    {
      $inc: { accessCount: 1 },
      $set: { lastAccessAt: new Date() },
      $addToSet: { distinctIps: ip || "unknown" },
      $push: {
        accessLog: {
          $each: [{ at: new Date(), ip: ip || "unknown", userAgent: userAgent || "" }],
          $position: 0,
          $slice: ACCESS_LOG_LIMIT,
        },
      },
    },
    { new: true }
  )
}
