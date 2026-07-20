import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import Product from "../models/Product.js"

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
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { slug: id }

  const product = await Product.findOne(query)
    .populate("category", "name slug icon tone")
    .populate("brand", "name slug")
  if (!product) throw new ApiError(404, "Product not found")
  res.json(product)
})

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, createdBy: req.user._id })
  res.status(201).json(product)
})

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new ApiError(404, "Product not found")

  Object.assign(product, req.body)
  await product.save()
  res.json(product)
})

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) throw new ApiError(404, "Product not found")
  res.json({ message: "Product deleted" })
})
