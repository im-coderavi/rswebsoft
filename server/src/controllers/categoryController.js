import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import Category from "../models/Category.js"
import Product from "../models/Product.js"
import HomeSection from "../models/HomeSection.js"

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 })
  const counts = await Product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }])
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]))

  res.json(categories.map((c) => ({ ...c.toObject(), productCount: countMap[String(c._id)] || 0 })))
})

export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body)
  res.status(201).json(category)
})

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new ApiError(404, "Category not found")

  Object.assign(category, req.body)
  await category.save()
  res.json(category)
})

export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.exists({ category: req.params.id })
  if (inUse) throw new ApiError(409, "Cannot delete a category that has products")

  const usedBySection = await HomeSection.exists({ "filters.category": req.params.id })
  if (usedBySection) throw new ApiError(409, "Category is used by a homepage section")

  const category = await Category.findByIdAndDelete(req.params.id)
  if (!category) throw new ApiError(404, "Category not found")
  res.json({ message: "Category deleted" })
})
