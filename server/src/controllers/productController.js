import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import Product from "../models/Product.js"
import { slugify } from "../utils/slugify.js"

export const listProducts = asyncHandler(async (req, res) => {
  const { search, category, brand, status, type, featured, page = 1, limit = 20 } = req.query

  const filter = {}
  if (search) filter.$text = { $search: search }
  if (category) filter.category = category
  if (brand) filter.brand = brand
  if (status) filter.status = status
  if (type) filter.type = type
  if (featured != null) filter.featured = featured === "true"

  const pageNum = Math.max(1, Number(page) || 1)
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20))

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug icon tone")
      .populate("brand", "name slug")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ])

  res.json({
    items,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
  })
})

export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params

  // An id, the current slug, or one this product used to live at — so a URL
  // that was shared or indexed before a slug change still resolves.
  const query = mongoose.isValidObjectId(id)
    ? { _id: id }
    : { $or: [{ slug: id }, { previousSlugs: id }] }

  const product = await Product.findOne(query)
    .populate("category", "name slug icon tone")
    .populate("brand", "name slug")
  if (!product) throw new ApiError(404, "Product not found")
  res.json(product)
})

// Turns a duplicate-slug write into something the admin can act on. Without
// this Mongo's raw E11000 surfaces as an unexplained 500.
function slugConflictError(err) {
  if (err?.code === 11000 && err?.keyPattern?.slug) {
    return new ApiError(409, "That URL is already used by another product — pick a different one")
  }
  return err
}

// Finds a free slug near the one asked for: "gp-sports", then "gp-sports-2",
// "gp-sports-3". Only used when the admin left the field empty; a slug they
// typed themselves is never silently altered — they get the 409 instead.
async function findFreeSlug(base, excludeId) {
  const taken = async (candidate) =>
    Product.exists({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })

  if (!(await taken(base))) return base

  for (let n = 2; n < 200; n++) {
    const candidate = `${base}-${n}`
    if (!(await taken(candidate))) return candidate
  }
  // Absurd number of near-identical names; fall back to something unique.
  return `${base}-${Date.now().toString(36)}`
}

export const createProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body, createdBy: req.user._id }

  // Only auto-resolve collisions for a slug we generated ourselves.
  if (!payload.slug?.trim() && payload.name) {
    payload.slug = await findFreeSlug(slugify(payload.name))
  }

  try {
    const product = await Product.create(payload)
    res.status(201).json(product)
  } catch (err) {
    throw slugConflictError(err)
  }
})

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new ApiError(404, "Product not found")

  const slugBefore = product.slug

  const payload = { ...req.body }
  if (payload.slug !== undefined && !String(payload.slug).trim()) {
    // Cleared on purpose — regenerate from the (possibly new) name.
    payload.slug = await findFreeSlug(slugify(payload.name || product.name), product._id)
  }

  Object.assign(product, payload)

  // Keep the old address working. Guarded against re-adding a slug the product
  // has since moved back to.
  if (slugBefore && product.slug !== slugBefore && !product.previousSlugs.includes(slugBefore)) {
    product.previousSlugs.push(slugBefore)
  }
  product.previousSlugs = product.previousSlugs.filter((s) => s !== product.slug)

  try {
    await product.save()
    res.json(product)
  } catch (err) {
    throw slugConflictError(err)
  }
})

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) throw new ApiError(404, "Product not found")
  res.json({ message: "Product deleted" })
})

// Admin-only. The delivered file and its password live behind this route
// rather than on GET /products/:id, so a public product response can never
// carry them by accident — the storefront endpoints simply don't select them.
export const getProductDownloadConfig = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select("+downloadUrl +downloadPassword")
  if (!product) throw new ApiError(404, "Product not found")

  res.json({
    downloadUrl: product.downloadUrl || "",
    downloadPassword: product.downloadPassword || "",
  })
})

export const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) throw new ApiError(400, "No product ids provided")

  const result = await Product.deleteMany({ _id: { $in: ids } })
  res.json({ message: "Products deleted", deletedCount: result.deletedCount })
})

export const bulkUpdateProductStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body
  if (!Array.isArray(ids) || ids.length === 0) throw new ApiError(400, "No product ids provided")
  if (!["published", "draft"].includes(status)) throw new ApiError(400, "Invalid status")

  const result = await Product.updateMany({ _id: { $in: ids } }, { $set: { status } })
  res.json({ message: "Products updated", modifiedCount: result.modifiedCount })
})
