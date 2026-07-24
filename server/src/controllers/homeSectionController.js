import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import HomeSection from "../models/HomeSection.js"
import { resolveSectionProducts } from "../utils/resolveSectionProducts.js"

export const listPublicHomeSections = asyncHandler(async (req, res) => {
  const sections = await HomeSection.find({ isActive: true }).sort({ order: 1, createdAt: 1 })

  const resolved = await Promise.all(
    sections.map(async (section) => ({
      _id: section._id,
      title: section.title,
      subtitle: section.subtitle,
      slug: section.slug,
      layout: section.layout,
      ctaLink: section.ctaLink,
      products: await resolveSectionProducts(section),
    }))
  )

  res.json(resolved)
})

export const listAdminHomeSections = asyncHandler(async (req, res) => {
  const sections = await HomeSection.find()
    .sort({ order: 1, createdAt: 1 })
    .populate("filters.category", "name slug")
    .populate("manualProducts", "name slug")

  const withCounts = await Promise.all(
    sections.map(async (section) => ({
      ...section.toObject(),
      productCount: (await resolveSectionProducts(section)).length,
    }))
  )

  res.json(withCounts)
})

export const createHomeSection = asyncHandler(async (req, res) => {
  const last = await HomeSection.findOne().sort({ order: -1 })
  const order = last ? last.order + 1 : 0
  const section = await HomeSection.create({ ...req.body, order })
  res.status(201).json(section)
})

export const updateHomeSection = asyncHandler(async (req, res) => {
  const section = await HomeSection.findById(req.params.id)
  if (!section) throw new ApiError(404, "Section not found")

  Object.assign(section, req.body)
  await section.save()
  res.json(section)
})

export const deleteHomeSection = asyncHandler(async (req, res) => {
  const section = await HomeSection.findByIdAndDelete(req.params.id)
  if (!section) throw new ApiError(404, "Section not found")
  res.json({ message: "Section deleted" })
})

export const reorderHomeSections = asyncHandler(async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) throw new ApiError(400, "ids array is required")

  await Promise.all(ids.map((id, index) => HomeSection.updateOne({ _id: id }, { order: index })))

  const sections = await HomeSection.find().sort({ order: 1, createdAt: 1 })
  res.json(sections)
})
