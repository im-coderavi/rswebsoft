import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import Brand from "../models/Brand.js"
import Product from "../models/Product.js"

export const listBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ name: 1 })
  const counts = await Product.aggregate([{ $group: { _id: "$brand", count: { $sum: 1 } } }])
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]))

  res.json(brands.map((b) => ({ ...b.toObject(), productCount: countMap[String(b._id)] || 0 })))
})

export const createBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.create(req.body)
  res.status(201).json(brand)
})

export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id)
  if (!brand) throw new ApiError(404, "Brand not found")

  Object.assign(brand, req.body)
  await brand.save()
  res.json(brand)
})

export const deleteBrand = asyncHandler(async (req, res) => {
  const inUse = await Product.exists({ brand: req.params.id })
  if (inUse) throw new ApiError(409, "Cannot delete a brand that has products")

  const brand = await Brand.findByIdAndDelete(req.params.id)
  if (!brand) throw new ApiError(404, "Brand not found")
  res.json({ message: "Brand deleted" })
})
